const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // ========== 在这里添加/修改音频列表 ==========
        // 支持本地音频和在线音频URL
        const audioFiles = ref([
            {
                id: 1,
                name: '哄睡白噪音',
                url: './assets/哄睡白噪音.mp3'  // 本地音频
            },
            // 示例：添加在线音频
            // {
            //     id: 2,
            //     name: '雨声白噪音',
            //     url: 'https://example.com/rain.mp3'  // 在线音频
            // },
            // {
            //     id: 3,
            //     name: '海浪声',
            //     url: 'https://example.com/ocean.mp3'
            // }
        ]);

        const currentTrack = ref(null);
        const audioElement = ref(null);
        const volume = ref(0.7);
        const isPlaying = ref(false);
        const currentTime = ref(0);
        const duration = ref(0);
        const wakeLock = ref(null);

        // 初始化音频元素
        onMounted(() => {
            audioElement.value = new Audio();
            audioElement.value.loop = true;
            audioElement.value.volume = volume.value;

            // 音频事件监听
            audioElement.value.addEventListener('timeupdate', updateProgress);
            audioElement.value.addEventListener('loadedmetadata', () => {
                duration.value = audioElement.value.duration;
            });
            audioElement.value.addEventListener('play', () => {
                isPlaying.value = true;
            });
            audioElement.value.addEventListener('pause', () => {
                isPlaying.value = false;
            });

            // 页面可见性变化时处理播放
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('beforeunload', cleanup);

            // 加载保存的音量
            const savedVolume = localStorage.getItem('playerVolume');
            if (savedVolume !== null) {
                volume.value = parseFloat(savedVolume);
                audioElement.value.volume = volume.value;
            }
        });

        // 处理页面可见性变化
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isPlaying.value) {
                try {
                    if (audioElement.value && audioElement.value.paused) {
                        await audioElement.value.play();
                    }
                    await requestWakeLock();
                } catch (error) {
                    console.log('自动播放被阻止');
                }
            }
        };

        // 请求屏幕常亮锁
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock.value = await navigator.wakeLock.request('screen');
                    console.log('屏幕常亮已启用');
                }
            } catch (err) {
                console.log('屏幕常亮请求失败:', err);
            }
        };

        // 释放屏幕常亮锁
        const releaseWakeLock = async () => {
            if (wakeLock.value !== null) {
                try {
                    await wakeLock.value.release();
                    wakeLock.value = null;
                } catch (err) {
                    console.log('释放屏幕常亮失败');
                }
            }
        };

        // 更新播放进度
        const updateProgress = () => {
            if (audioElement.value) {
                currentTime.value = audioElement.value.currentTime;
            }
        };

        // 格式化时间
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // 播放指定曲目
        const playTrack = async (track) => {
            try {
                currentTrack.value = track;
                audioElement.value.src = track.url;
                await audioElement.value.play();
                await requestWakeLock();
            } catch (error) {
                console.error('播放失败:', error);
                alert('播放失败，请检查音频URL是否正确');
                return;
            }

            // 设置Media Session API（锁屏控制）- 失败不影响播放
            try {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = {
                        title: track.name,
                        artist: '宝宝哄睡音频',
                        album: '白噪音',
                        artwork: [
                            { src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌙</text></svg>', sizes: '96x96', type: 'image/svg+xml' },
                            { src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌙</text></svg>', sizes: '512x512', type: 'image/svg+xml' }
                        ]
                    };

                    navigator.mediaSession.setActionHandler('play', async () => {
                        await audioElement.value.play();
                    });

                    navigator.mediaSession.setActionHandler('pause', async () => {
                        audioElement.value.pause();
                    });
                }
            } catch (error) {
                console.log('Media Session API 设置失败（不影响播放）:', error);
            }
        };

        // 切换播放/暂停
        const togglePlay = async () => {
            if (!currentTrack.value) {
                if (audioFiles.value.length > 0) {
                    await playTrack(audioFiles.value[0]);
                }
                return;
            }

            try {
                if (isPlaying.value) {
                    audioElement.value.pause();
                    await releaseWakeLock();
                } else {
                    await audioElement.value.play();
                    await requestWakeLock();
                }
            } catch (error) {
                console.error('播放控制失败:', error);
            }
        };

        // 停止播放
        const stopPlay = () => {
            if (audioElement.value) {
                audioElement.value.pause();
                audioElement.value.currentTime = 0;
            }
            releaseWakeLock();
        };

        // 调整音量
        const handleVolumeChange = (event) => {
            const newVolume = parseFloat(event.target.value);
            volume.value = newVolume;
            if (audioElement.value) {
                audioElement.value.volume = newVolume;
            }
            localStorage.setItem('playerVolume', newVolume.toString());
        };

        // 进度条拖动
        const seekTo = (event) => {
            if (audioElement.value && duration.value) {
                const percent = event.target.value;
                audioElement.value.currentTime = (percent / 100) * duration.value;
            }
        };

        // 清理资源
        const cleanup = () => {
            releaseWakeLock();
        };

        return {
            audioFiles,
            currentTrack,
            volume,
            isPlaying,
            currentTime,
            duration,
            playTrack,
            togglePlay,
            stopPlay,
            handleVolumeChange,
            formatTime,
            seekTo
        };
    },
    template: `
        <div class="player-container">
            <div class="header">
                <h1>🌙 宝宝哄睡音频</h1>
                <p class="subtitle">单曲循环 · 后台播放</p>
            </div>

            <div class="player-content">
                <!-- 当前播放信息 -->
                <div class="now-playing">
                    <div class="track-icon">🌙</div>
                    <div class="track-info">
                        <h2>{{ currentTrack ? currentTrack.name : '选择音频开始播放' }}</h2>
                        <p>{{ isPlaying ? '播放中' : '已暂停' }}</p>
                    </div>
                </div>

                <!-- 进度条 -->
                <div class="progress-container">
                    <span class="time">{{ formatTime(currentTime) }}</span>
                    <input
                        type="range"
                        class="progress-bar"
                        :value="duration ? (currentTime / duration * 100) : 0"
                        @input="seekTo"
                        min="0"
                        max="100"
                    >
                    <span class="time">{{ formatTime(duration) }}</span>
                </div>

                <!-- 控制按钮 -->
                <div class="controls">
                    <button class="control-btn" @click="stopPlay" title="停止">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                    </button>
                    <button class="control-btn play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
                        <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                    </button>
                </div>

                <!-- 音量控制 -->
                <div class="volume-control">
                    <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                    <input
                        type="range"
                        class="volume-slider"
                        v-model="volume"
                        @input="handleVolumeChange"
                        min="0"
                        max="1"
                        step="0.01"
                    >
                    <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
                </div>

                <!-- 播放提示 -->
                <div class="tips">
                    <p>💡 添加到主屏幕可获得更好的体验</p>
                    <p>🔒 支持锁屏播放和后台播放</p>
                </div>
            </div>

            <!-- 音频列表 -->
            <div class="playlist">
                <h3>🎵 音频列表</h3>
                <div
                    v-for="track in audioFiles"
                    :key="track.id"
                    class="track-item"
                    :class="{ active: currentTrack && currentTrack.id === track.id }"
                    @click="playTrack(track)"
                >
                    <div class="track-info">
                        <span class="track-name">{{ track.name }}</span>
                        <span v-if="currentTrack && currentTrack.id === track.id && isPlaying" class="playing-indicator">
                            播放中
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `
}).mount('#app');
