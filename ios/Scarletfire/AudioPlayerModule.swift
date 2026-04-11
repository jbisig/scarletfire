import Foundation
import AVFoundation
import MediaPlayer
import UIKit
import React

@objc(AudioPlayerModule)
class AudioPlayerModule: RCTEventEmitter {

  private var player: AVQueuePlayer?
  private var currentItems: [AVPlayerItem] = []
  private var timeObserver: Any?
  private var statusObservers: [NSKeyValueObservation] = []
  private var originalTracks: [[String: Any]] = []
  private var currentTrackIndex: Int = 0
  private var queueStartIndex: Int = 0  // Tracks offset between currentItems and originalTracks
  private var isRebuildingQueue: Bool = false  // Prevents race conditions during queue rebuild
  private var cachedArtwork: MPMediaItemArtwork?
  private var cachedArtworkUrl: String?
  private var audioSessionActivated: Bool = false  // Deferred until first play so we don't interrupt other apps at launch

  override init() {
    super.init()
    setupAudioSession()
    setupPlayer()
    setupTrackEndObserver()
    warmDownloadEndpoint()
  }

  // Warms the native TCP/TLS connection pool for archive.org's download hosts
  // so the first real audio stream doesn't pay the full handshake cost. The
  // fetch() warmup in App.tsx uses a different URLSession than AVPlayer, so
  // this native-side warmup is needed separately. Following the redirect warms
  // the ia***.us.archive.org host that actually serves the file.
  private func warmDownloadEndpoint() {
    guard let url = URL(string: "https://archive.org/download/gd1977-05-08.shure57.hicks.4982.sbeok.shnf/gd1977-05-08.shure57.hicks.4982.sbeok.shnf_files.xml") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "HEAD"
    request.timeoutInterval = 10
    URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
  }

  // MARK: - Track End Observer (for automatic advancement)

  private func setupTrackEndObserver() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playerItemDidFinishPlaying(_:)),
      name: .AVPlayerItemDidPlayToEndTime,
      object: nil
    )
  }

  @objc private func playerItemDidFinishPlaying(_ notification: Notification) {
    // Check if this is from one of our player items
    guard let finishedItem = notification.object as? AVPlayerItem else {
      return
    }

    // Find the index of the finished item in our currentItems array
    guard let finishedIndex = currentItems.firstIndex(of: finishedItem) else {
      return // Not our item
    }

    // Convert finishedIndex (index in currentItems) to global index (index in originalTracks)
    // currentItems only contains tracks from queueStartIndex onwards
    let globalFinishedIndex = finishedIndex + queueStartIndex

    // Only handle if this is the currently playing track
    guard globalFinishedIndex == currentTrackIndex else {
      return
    }

    // AVQueuePlayer will automatically advance - we just need to update our state
    let nextIndex = currentTrackIndex + 1

    if nextIndex < originalTracks.count {
      currentTrackIndex = nextIndex
      updateNowPlayingInfo()
      sendEvent(withName: "playback-track-changed", body: ["trackIndex": currentTrackIndex])
    } else {
      // Queue ended
      sendEvent(withName: "playback-queue-ended", body: nil)
    }
  }

  // MARK: - Setup

  private func setupAudioSession() {
    // Only configure the category here — do NOT activate the session.
    // Activating at app launch would interrupt other audio apps (Spotify, etc.).
    // The session is activated lazily on the first play() call.
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playback, mode: .default, options: [])

      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleRouteChange),
        name: AVAudioSession.routeChangeNotification,
        object: audioSession
      )
    } catch {
      print("Failed to setup audio session: \(error)")
    }
  }

  private func activateAudioSessionIfNeeded() {
    guard !audioSessionActivated else { return }
    do {
      // Deactivate first, then reconfigure, then reactivate. This is required
      // because expo-av (used for the background video) has already activated
      // the shared AVAudioSession in mix-with-others mode. Simply changing the
      // category options doesn't take effect until the next activation, so we
      // must deactivate and reactivate to properly interrupt other audio apps
      // (Spotify / Apple Music / podcasts) when the user starts a track.
      let audioSession = AVAudioSession.sharedInstance()
      try? audioSession.setActive(false, options: [])
      try audioSession.setCategory(.playback, mode: .default, options: [])
      try audioSession.setActive(true)
      audioSessionActivated = true
    } catch {
      print("Failed to activate audio session: \(error)")
    }
  }

  @objc private func handleRouteChange(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }

    if reason == .oldDeviceUnavailable {
      // Audio route disconnected (CarPlay unplugged, headphones removed, etc.)
      // AVQueuePlayer pauses automatically, but we need to sync the UI state
      DispatchQueue.main.async { [weak self] in
        self?.sendEvent(withName: "playback-state", body: ["state": "paused"])
        self?.updateNowPlayingInfo()
      }
    }
  }

  private func setupPlayer() {
    player = AVQueuePlayer()
    setupTimeObserver()
    setupRemoteCommandCenter()
  }

  // MARK: - Remote Command Center (Lock Screen Controls)

  private func setupRemoteCommandCenter() {
    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.playCommand.addTarget { [weak self] _ in
      self?.playInternal()
      return .success
    }

    commandCenter.pauseCommand.addTarget { [weak self] _ in
      self?.pauseInternal()
      return .success
    }

    // Send remote command events to JS so shuffle-aware logic can handle them
    commandCenter.nextTrackCommand.addTarget { [weak self] _ in
      self?.sendEvent(withName: "remote-next-track", body: nil)
      return .success
    }

    commandCenter.previousTrackCommand.addTarget { [weak self] _ in
      self?.sendEvent(withName: "remote-previous-track", body: nil)
      return .success
    }

    commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      if let event = event as? MPChangePlaybackPositionCommandEvent {
        self?.seekToInternal(event.positionTime)
        return .success
      }
      return .commandFailed
    }
  }

  // MARK: - Time Observer

  private func setupTimeObserver() {
    let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
      guard let self = self else { return }

      let currentTime = CMTimeGetSeconds(time)
      let duration = CMTimeGetSeconds(self.player?.currentItem?.duration ?? .zero)

      if !currentTime.isNaN && !duration.isNaN {
        self.sendEvent(withName: "playback-progress", body: [
          "position": currentTime,
          "duration": duration
        ])
        self.updateNowPlayingProgress(currentTime: currentTime, duration: duration)
      }
    }
  }

  // MARK: - Now Playing Info

  private func updateNowPlayingInfo() {
    guard currentTrackIndex < originalTracks.count else { return }
    let trackData = originalTracks[currentTrackIndex]

    var nowPlayingInfo = [String: Any]()
    nowPlayingInfo[MPMediaItemPropertyTitle] = trackData["title"] as? String ?? "Unknown"
    nowPlayingInfo[MPMediaItemPropertyArtist] = trackData["artist"] as? String ?? "Grateful Dead"

    if let duration = trackData["duration"] as? Double {
      nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
    }

    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = CMTimeGetSeconds(player?.currentTime() ?? .zero)
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player?.rate ?? 0

    // Set artwork - use cached if available, otherwise set what we have and fetch async
    if let artwork = cachedArtwork {
      nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
    }

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

    // Load artwork from track URL if it changed
    let artworkUrl = trackData["artwork"] as? String
    if artworkUrl != cachedArtworkUrl {
      cachedArtworkUrl = artworkUrl
      cachedArtwork = nil
      if let urlString = artworkUrl, let url = URL(string: urlString) {
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
          guard let self = self, let data = data, let image = UIImage(data: data) else { return }
          let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
          DispatchQueue.main.async {
            self.cachedArtwork = artwork
            self.cachedArtworkUrl = urlString
            // Update now playing info with the loaded artwork
            if var info = MPNowPlayingInfoCenter.default().nowPlayingInfo {
              info[MPMediaItemPropertyArtwork] = artwork
              MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            }
          }
        }.resume()
      }
    }
  }

  private func updateNowPlayingProgress(currentTime: Double, duration: Double) {
    var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
    nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player?.rate ?? 0
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
  }

  // MARK: - React Native Bridge

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return [
      "playback-state",
      "playback-track-changed",
      "playback-progress",
      "playback-error",
      "playback-queue-ended",
      "remote-next-track",
      "remote-previous-track"
    ]
  }

  // MARK: - Playback Control Methods

  @objc func setupPlayer(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(nil)
  }

  @objc func play(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    playInternal()
    resolve(nil)
  }

  private func playInternal() {
    activateAudioSessionIfNeeded()
    player?.play()
    sendEvent(withName: "playback-state", body: ["state": "playing"])
    updateNowPlayingInfo()
  }

  @objc func pause(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    pauseInternal()
    resolve(nil)
  }

  private func pauseInternal() {
    player?.pause()
    sendEvent(withName: "playback-state", body: ["state": "paused"])
  }

  @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    player?.pause()
    player?.removeAllItems()
    currentItems.removeAll()
    originalTracks.removeAll()
    currentTrackIndex = 0
    queueStartIndex = 0
    sendEvent(withName: "playback-state", body: ["state": "stopped"])
    resolve(nil)
  }

  @objc func seekTo(_ position: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    seekToInternal(position)
    resolve(nil)
  }

  private func seekToInternal(_ position: Double) {
    let time = CMTime(seconds: position, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    player?.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
  }

  @objc func skipToNext(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    skipToNextInternal()
    resolve(nil)
  }

  private func skipToNextInternal() {
    guard currentTrackIndex < originalTracks.count - 1 else { return }
    currentTrackIndex += 1
    player?.advanceToNextItem()
    updateNowPlayingInfo()
    sendEvent(withName: "playback-track-changed", body: ["trackIndex": currentTrackIndex])
  }

  @objc func skipToPrevious(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    skipToPreviousInternal()
    resolve(nil)
  }

  private func skipToPreviousInternal() {
    // If we're past 3 seconds into the track, just restart it
    let currentTime = CMTimeGetSeconds(player?.currentTime() ?? .zero)
    if currentTime > 3 {
      seekToInternal(0)
      return
    }

    // Otherwise go to previous track
    guard currentTrackIndex > 0 else {
      seekToInternal(0)
      return
    }

    currentTrackIndex -= 1
    rebuildQueueFromCurrentIndex()
    sendEvent(withName: "playback-track-changed", body: ["trackIndex": currentTrackIndex])
  }

  private func rebuildQueueFromCurrentIndex() {
    // Prevent concurrent rebuilds which could cause race conditions
    guard !isRebuildingQueue else { return }
    isRebuildingQueue = true

    // Capture playback state atomically before any modifications
    let wasPlaying = player?.rate != 0
    let seekPosition = player?.currentTime()

    // Pause during rebuild to prevent state changes
    player?.pause()

    // Clear existing queue
    player?.removeAllItems()
    currentItems.removeAll()
    statusObservers.removeAll()

    // Update queueStartIndex since we're rebuilding from currentTrackIndex
    queueStartIndex = currentTrackIndex

    // Rebuild from current index
    let tracksToAdd = Array(originalTracks.dropFirst(currentTrackIndex))

    for trackData in tracksToAdd {
      guard let urlString = trackData["url"] as? String,
            let url = URL(string: urlString) else {
        continue
      }

      let asset = AVURLAsset(url: url)
      let item = AVPlayerItem(asset: asset)

      let observer = item.observe(\.status) { [weak self] item, _ in
        if item.status == .failed {
          self?.sendEvent(withName: "playback-error", body: [
            "error": item.error?.localizedDescription ?? "Unknown error"
          ])
        }
      }
      statusObservers.append(observer)

      if player?.items().isEmpty ?? true {
        player = AVQueuePlayer(playerItem: item)
        setupTimeObserver()
      } else {
        player?.insert(item, after: nil)
      }

      currentItems.append(item)
    }

    updateNowPlayingInfo()

    // Restore playback state atomically after rebuild is complete
    isRebuildingQueue = false
    if wasPlaying {
      player?.play()
    }
  }

  @objc func setQueue(_ tracks: [[String: Any]], startIndex: Int, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Store original tracks for skip previous functionality
    originalTracks = tracks
    currentTrackIndex = startIndex
    queueStartIndex = startIndex  // Remember offset for index calculations

    // Clear existing queue
    player?.removeAllItems()
    currentItems.removeAll()
    statusObservers.removeAll()

    // Only add tracks starting from startIndex
    let tracksToAdd = Array(tracks.dropFirst(startIndex))

    // Add new tracks
    for trackData in tracksToAdd {
      guard let urlString = trackData["url"] as? String,
            let url = URL(string: urlString) else {
        continue
      }

      let asset = AVURLAsset(url: url)
      let item = AVPlayerItem(asset: asset)

      // Observe when track finishes
      let observer = item.observe(\.status) { [weak self] item, _ in
        if item.status == .failed {
          self?.sendEvent(withName: "playback-error", body: [
            "error": item.error?.localizedDescription ?? "Unknown error"
          ])
        }
      }
      statusObservers.append(observer)

      // Add to queue
      if player?.items().isEmpty ?? true {
        player = AVQueuePlayer(playerItem: item)
        setupTimeObserver()
      } else {
        player?.insert(item, after: nil)
      }

      currentItems.append(item)
    }

    updateNowPlayingInfo()
    resolve(nil)
  }

  @objc func addTrack(_ trackData: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let urlString = trackData["url"] as? String,
          let url = URL(string: urlString) else {
      reject("INVALID_URL", "Invalid track URL", nil)
      return
    }

    let asset = AVURLAsset(url: url)
    let item = AVPlayerItem(asset: asset)

    // Add to originalTracks so track end observer knows about it
    originalTracks.append(trackData)

    // If player has no current item (queue ended), we need to make this track current
    let needsToBecomeCurrent = player?.currentItem == nil

    if needsToBecomeCurrent {
      // Recreate player with this item as current
      player = AVQueuePlayer(playerItem: item)
      setupTimeObserver()
      currentItems = [item]
      currentTrackIndex = originalTracks.count - 1
      queueStartIndex = currentTrackIndex
    } else {
      player?.insert(item, after: nil)
      currentItems.append(item)
    }

    resolve(nil)
  }

  @objc func getState(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let state: String
    if player?.rate == 0 {
      state = "paused"
    } else {
      state = "playing"
    }
    resolve(state)
  }

  @objc func getProgress(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let currentTime = CMTimeGetSeconds(player?.currentTime() ?? .zero)
    let duration = CMTimeGetSeconds(player?.currentItem?.duration ?? .zero)

    resolve([
      "position": currentTime.isNaN ? 0 : currentTime,
      "duration": duration.isNaN ? 0 : duration,
      "buffered": 0
    ])
  }

  @objc func reset(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    player?.pause()
    player?.removeAllItems()
    currentItems.removeAll()
    statusObservers.removeAll()
    originalTracks.removeAll()
    currentTrackIndex = 0
    queueStartIndex = 0
    resolve(nil)
  }

  // MARK: - Cleanup

  deinit {
    if let observer = timeObserver {
      player?.removeTimeObserver(observer)
    }
    statusObservers.removeAll()
    NotificationCenter.default.removeObserver(self)
  }
}
