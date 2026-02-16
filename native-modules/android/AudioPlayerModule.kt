package com.scarletfire.app

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.PlaybackException
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AudioPlayerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null
    private var mediaSessionCompat: MediaSessionCompat? = null
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    private var originalTracks: MutableList<ReadableMap> = mutableListOf()
    private var currentTrackIndex: Int = 0

    override fun getName(): String = "AudioPlayerModule"

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun setupProgressObserver() {
        progressRunnable?.let { handler.removeCallbacks(it) }

        progressRunnable = object : Runnable {
            override fun run() {
                player?.let { p ->
                    if (p.playbackState == Player.STATE_READY || p.playbackState == Player.STATE_BUFFERING) {
                        val position = p.currentPosition / 1000.0
                        val duration = p.duration / 1000.0

                        if (duration > 0) {
                            val params = Arguments.createMap().apply {
                                putDouble("position", position)
                                putDouble("duration", duration)
                            }
                            sendEvent("playback-progress", params)
                            updateMediaSessionPlaybackState()
                        }
                    }
                }
                handler.postDelayed(this, 500)
            }
        }
        handler.post(progressRunnable!!)
    }

    private fun setupPlayerListener() {
        player?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                val state = when (playbackState) {
                    Player.STATE_IDLE -> "stopped"
                    Player.STATE_BUFFERING -> "buffering"
                    Player.STATE_READY -> if (player?.isPlaying == true) "playing" else "paused"
                    Player.STATE_ENDED -> "stopped"
                    else -> "none"
                }

                val params = Arguments.createMap().apply {
                    putString("state", state)
                }
                sendEvent("playback-state", params)
                updateMediaSessionPlaybackState()
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                val state = if (isPlaying) "playing" else "paused"
                val params = Arguments.createMap().apply {
                    putString("state", state)
                }
                sendEvent("playback-state", params)
                updateMediaSessionPlaybackState()
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                if (reason == Player.MEDIA_ITEM_TRANSITION_REASON_AUTO) {
                    // Track ended and moved to next
                    val nextIndex = currentTrackIndex + 1
                    if (nextIndex < originalTracks.size) {
                        currentTrackIndex = nextIndex
                        updateNowPlayingInfo()
                        val params = Arguments.createMap().apply {
                            putInt("trackIndex", currentTrackIndex)
                        }
                        sendEvent("playback-track-changed", params)
                    } else {
                        // Queue ended
                        sendEvent("playback-queue-ended", null)
                    }
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                val params = Arguments.createMap().apply {
                    putString("error", error.message ?: "Unknown error")
                }
                sendEvent("playback-error", params)
            }
        })
    }

    private fun setupMediaSession() {
        val context = reactApplicationContext

        // Create MediaSessionCompat for lock screen controls
        mediaSessionCompat = MediaSessionCompat(context, "ScarletfireMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    player?.play()
                }

                override fun onPause() {
                    player?.pause()
                }

                override fun onStop() {
                    player?.stop()
                }

                override fun onSkipToNext() {
                    skipToNextInternal()
                }

                override fun onSkipToPrevious() {
                    skipToPreviousInternal()
                }

                override fun onSeekTo(pos: Long) {
                    player?.seekTo(pos)
                }
            })
            isActive = true
        }

        // Create Media3 MediaSession
        player?.let { p ->
            mediaSession = MediaSession.Builder(context, p)
                .setId("ScarletfireMediaSession")
                .build()
        }
    }

    private fun updateNowPlayingInfo() {
        if (currentTrackIndex >= originalTracks.size) return

        val trackData = originalTracks[currentTrackIndex]
        val title = trackData.getString("title") ?: "Unknown"
        val artist = trackData.getString("artist") ?: "Grateful Dead"
        val duration = if (trackData.hasKey("duration")) {
            (trackData.getDouble("duration") * 1000).toLong()
        } else {
            0L
        }

        mediaSessionCompat?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration)
                .build()
        )

        updateMediaSessionPlaybackState()
    }

    private fun updateMediaSessionPlaybackState() {
        val state = when {
            player?.isPlaying == true -> PlaybackStateCompat.STATE_PLAYING
            player?.playbackState == Player.STATE_BUFFERING -> PlaybackStateCompat.STATE_BUFFERING
            player?.playbackState == Player.STATE_READY -> PlaybackStateCompat.STATE_PAUSED
            else -> PlaybackStateCompat.STATE_STOPPED
        }

        val position = player?.currentPosition ?: 0L
        val playbackSpeed = if (player?.isPlaying == true) 1.0f else 0f

        mediaSessionCompat?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(state, position, playbackSpeed)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_PLAY_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                    PlaybackStateCompat.ACTION_SEEK_TO or
                    PlaybackStateCompat.ACTION_STOP
                )
                .build()
        )
    }

    // MARK: - React Native Bridge Methods

    @ReactMethod
    fun setupPlayer(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                if (player == null) {
                    player = ExoPlayer.Builder(reactApplicationContext).build()
                    setupPlayerListener()
                    setupMediaSession()
                    setupProgressObserver()
                }
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("SETUP_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun play(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            player?.play()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            player?.pause()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            player?.stop()
            player?.clearMediaItems()
            originalTracks.clear()
            currentTrackIndex = 0

            val params = Arguments.createMap().apply {
                putString("state", "stopped")
            }
            sendEvent("playback-state", params)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun seekTo(position: Double, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            player?.seekTo((position * 1000).toLong())
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun skipToNext(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            skipToNextInternal()
            promise.resolve(null)
        }
    }

    private fun skipToNextInternal() {
        if (currentTrackIndex < originalTracks.size - 1) {
            currentTrackIndex++
            player?.seekToNextMediaItem()
            updateNowPlayingInfo()

            val params = Arguments.createMap().apply {
                putInt("trackIndex", currentTrackIndex)
            }
            sendEvent("playback-track-changed", params)
        }
    }

    @ReactMethod
    fun skipToPrevious(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            skipToPreviousInternal()
            promise.resolve(null)
        }
    }

    private fun skipToPreviousInternal() {
        val currentPosition = player?.currentPosition ?: 0L

        // If we're past 3 seconds, restart current track
        if (currentPosition > 3000) {
            player?.seekTo(0)
            return
        }

        // Otherwise go to previous track
        if (currentTrackIndex > 0) {
            currentTrackIndex--
            player?.seekToPreviousMediaItem()
            updateNowPlayingInfo()

            val params = Arguments.createMap().apply {
                putInt("trackIndex", currentTrackIndex)
            }
            sendEvent("playback-track-changed", params)
        } else {
            // At first track, just restart
            player?.seekTo(0)
        }
    }

    @ReactMethod
    fun setQueue(tracks: ReadableArray, startIndex: Int, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                originalTracks.clear()
                currentTrackIndex = startIndex

                val mediaItems = mutableListOf<MediaItem>()

                for (i in 0 until tracks.size()) {
                    val trackMap = tracks.getMap(i)
                    if (trackMap != null) {
                        originalTracks.add(trackMap)

                        val url = trackMap.getString("url") ?: continue
                        val title = trackMap.getString("title") ?: "Unknown"
                        val artist = trackMap.getString("artist") ?: "Grateful Dead"

                        val mediaItem = MediaItem.Builder()
                            .setUri(Uri.parse(url))
                            .setMediaMetadata(
                                MediaMetadata.Builder()
                                    .setTitle(title)
                                    .setArtist(artist)
                                    .build()
                            )
                            .build()

                        mediaItems.add(mediaItem)
                    }
                }

                player?.setMediaItems(mediaItems, startIndex, 0)
                player?.prepare()
                updateNowPlayingInfo()

                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("SET_QUEUE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun addTrack(trackData: ReadableMap, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val url = trackData.getString("url")
                if (url == null) {
                    promise.reject("INVALID_URL", "Track URL is required")
                    return@runOnUiThread
                }

                originalTracks.add(trackData)

                val title = trackData.getString("title") ?: "Unknown"
                val artist = trackData.getString("artist") ?: "Grateful Dead"

                val mediaItem = MediaItem.Builder()
                    .setUri(Uri.parse(url))
                    .setMediaMetadata(
                        MediaMetadata.Builder()
                            .setTitle(title)
                            .setArtist(artist)
                            .build()
                    )
                    .build()

                player?.addMediaItem(mediaItem)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ADD_TRACK_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getState(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            val state = when {
                player?.isPlaying == true -> "playing"
                player?.playbackState == Player.STATE_BUFFERING -> "buffering"
                player?.playbackState == Player.STATE_READY -> "paused"
                else -> "stopped"
            }
            promise.resolve(state)
        }
    }

    @ReactMethod
    fun getProgress(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            val position = (player?.currentPosition ?: 0L) / 1000.0
            val duration = (player?.duration ?: 0L) / 1000.0

            val result = Arguments.createMap().apply {
                putDouble("position", if (position.isNaN() || position < 0) 0.0 else position)
                putDouble("duration", if (duration.isNaN() || duration < 0) 0.0 else duration)
                putDouble("buffered", 0.0)
            }
            promise.resolve(result)
        }
    }

    @ReactMethod
    fun reset(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            player?.stop()
            player?.clearMediaItems()
            originalTracks.clear()
            currentTrackIndex = 0
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun refreshAudioSession(promise: Promise) {
        // Not needed on Android, but included for API compatibility
        promise.resolve(null)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RCTEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RCTEventEmitter
    }

    fun onDestroy() {
        progressRunnable?.let { handler.removeCallbacks(it) }
        mediaSession?.release()
        mediaSessionCompat?.release()
        player?.release()
        player = null
    }
}
