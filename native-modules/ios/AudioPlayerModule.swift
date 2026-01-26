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
  private lazy var artworkImage: MPMediaItemArtwork? = {
    // Try to load the app icon from the bundle
    // Check multiple possible locations where Expo/RN might bundle the icon
    var image: UIImage?

    // Try loading from asset catalog
    if image == nil {
      image = UIImage(named: "AppIcon")
    }

    // Try loading the expo icon asset
    if image == nil {
      image = UIImage(named: "icon")
    }

    // Try loading from main bundle directly
    if image == nil, let iconPath = Bundle.main.path(forResource: "icon", ofType: "png") {
      image = UIImage(contentsOfFile: iconPath)
    }

    // Try loading the splash image as fallback
    if image == nil, let splashPath = Bundle.main.path(forResource: "splash", ofType: "png") {
      image = UIImage(contentsOfFile: splashPath)
    }

    guard let finalImage = image else {
      return nil
    }

    return MPMediaItemArtwork(boundsSize: finalImage.size) { _ in finalImage }
  }()

  override init() {
    super.init()
    setupAudioSession()
    setupPlayer()
    setupTrackEndObserver()
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
    // Check if this is from our player's current item
    guard let finishedItem = notification.object as? AVPlayerItem,
          let currentItem = player?.currentItem,
          finishedItem == currentItem else {
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
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playback, mode: .default, options: [])
      try audioSession.setActive(true)
    } catch {
      print("Failed to setup audio session: \(error)")
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

    // Use nextTrackCommand/previousTrackCommand for track navigation
    commandCenter.nextTrackCommand.addTarget { [weak self] _ in
      self?.skipToNextInternal()
      return .success
    }

    commandCenter.previousTrackCommand.addTarget { [weak self] _ in
      self?.skipToPreviousInternal()
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

    // Set app icon as artwork
    if let artwork = artworkImage {
      nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
    }

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
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
      "playback-queue-ended"
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
    let wasPlaying = player?.rate != 0

    // Clear existing queue
    player?.removeAllItems()
    currentItems.removeAll()
    statusObservers.removeAll()

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

    if wasPlaying {
      player?.play()
    }
    updateNowPlayingInfo()
  }

  @objc func setQueue(_ tracks: [[String: Any]], startIndex: Int, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Store original tracks for skip previous functionality
    originalTracks = tracks
    currentTrackIndex = startIndex

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

    player?.insert(item, after: nil)
    currentItems.append(item)

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
