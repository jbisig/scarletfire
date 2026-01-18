import Foundation
import AVFoundation
import MediaPlayer
import React

@objc(AudioPlayerModule)
class AudioPlayerModule: RCTEventEmitter {

  private var player: AVQueuePlayer?
  private var currentItems: [AVPlayerItem] = []
  private var timeObserver: Any?
  private var statusObservers: [NSKeyValueObservation] = []

  override init() {
    super.init()
    setupAudioSession()
    setupPlayer()
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
      self?.play()
      return .success
    }

    commandCenter.pauseCommand.addTarget { [weak self] _ in
      self?.pause()
      return .success
    }

    commandCenter.skipForwardCommand.addTarget { [weak self] _ in
      self?.skipToNext()
      return .success
    }

    commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
      self?.skipToPrevious()
      return .success
    }

    commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      if let event = event as? MPChangePlaybackPositionCommandEvent {
        self?.seekTo(event.positionTime)
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
      }
    }
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
    player?.play()
    sendEvent(withName: "playback-state", body: ["state": "playing"])
    resolve(nil)
  }

  @objc func pause(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    player?.pause()
    sendEvent(withName: "playback-state", body: ["state": "paused"])
    resolve(nil)
  }

  @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    player?.pause()
    player?.removeAllItems()
    currentItems.removeAll()
    sendEvent(withName: "playback-state", body: ["state": "stopped"])
    resolve(nil)
  }

  @objc func seekTo(_ position: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    seekTo(position)
    resolve(nil)
  }

  private func seekTo(_ position: Double) {
    let time = CMTime(seconds: position, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    player?.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
  }

  @objc func skipToNext(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    skipToNext()
    resolve(nil)
  }

  private func skipToNext() {
    player?.advanceToNextItem()
    sendEvent(withName: "playback-track-changed", body: [:])
  }

  @objc func skipToPrevious(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // AVQueuePlayer doesn't support going backwards, so we'll seek to beginning
    seekTo(0)
    resolve(nil)
  }

  @objc func setQueue(_ tracks: [[String: Any]], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Clear existing queue
    player?.removeAllItems()
    currentItems.removeAll()
    statusObservers.removeAll()

    // Add new tracks
    for trackData in tracks {
      guard let urlString = trackData["url"] as? String,
            let url = URL(string: urlString) else {
        continue
      }

      let asset = AVURLAsset(url: url)
      let item = AVPlayerItem(asset: asset)

      // Observe when track finishes
      let observer = item.observe(\.status) { [weak self] item, _ in
        if item.status == .readyToPlay {
          // Track is ready
        } else if item.status == .failed {
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
    resolve(nil)
  }

  // MARK: - Cleanup

  deinit {
    if let observer = timeObserver {
      player?.removeTimeObserver(observer)
    }
    statusObservers.removeAll()
  }
}
