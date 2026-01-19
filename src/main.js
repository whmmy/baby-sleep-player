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
        const timerEndTime = ref(null);
        const timerHours = ref(0);
        const timerMinutes = ref(30);
        let timerId = null;

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
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
        };

        // 设置定时停止
        const setTimer = () => {
            const totalMinutes = timerHours.value * 60 + timerMinutes.value;
            if (totalMinutes <= 0) {
                alert('请设置有效的时间');
                return;
            }

            const now = new Date();
            timerEndTime.value = new Date(now.getTime() + totalMinutes * 60000);

            // 显示定时提示
            alert(`将在 ${timerHours.value}小时${timerMinutes.value}分钟后停止播放`);

            // 清除之前的定时器
            if (timerId) {
                clearTimeout(timerId);
            }

            // 启动定时器（后台播放时也会执行）
            timerId = setTimeout(() => {
                if (audioElement.value && !audioElement.value.paused) {
                    audioElement.value.pause();
                    audioElement.value.currentTime = 0;
                    isPlaying.value = false;
                    releaseWakeLock();
                    timerEndTime.value = null;
                    timerId = null;
                }
            }, totalMinutes * 60000);
        };

        // 取消定时
        const cancelTimer = () => {
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            timerEndTime.value = null;
        };

        // 格式化剩余时间
        const getRemainingTime = () => {
            if (!timerEndTime.value) return '';
            const now = new Date();
            const diff = timerEndTime.value - now;
            if (diff <= 0) return '';

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        // 每秒更新剩余时间（用于UI显示，不影响定时执行）
        setInterval(() => {
            if (timerEndTime.value) {
                const now = new Date();
                if (now >= timerEndTime.value) {
                    timerEndTime.value = null;
                }
            }
        }, 1000);

        return {
            audioFiles,
            currentTrack,
            volume,
            isPlaying,
            currentTime,
            duration,
            timerEndTime,
            timerHours,
            timerMinutes,
            playTrack,
            togglePlay,
            stopPlay,
            handleVolumeChange,
            formatTime,
            seekTo,
            setTimer,
            cancelTimer,
            getRemainingTime
        };
    },
    template: `
        <div class="player-container">
            <div class="header">
                <h1>🌙 宝宝哄睡音频</h1>
                <p class="subtitle">单曲循环 · 后台播放 · 定时停止</p>
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

                <!-- 定时停止 -->
                <div class="timer-section">
                    <div class="timer-header">
                        <span class="timer-icon">⏰</span>
                        <span class="timer-title">定时停止</span>
                        <span v-if="timerEndTime" class="timer-countdown">{{ getRemainingTime() }}</span>
                    </div>
                    <div v-if="!timerEndTime" class="timer-controls">
                        <select v-model="timerHours" class="timer-select">
                            <option :value="0">0小时</option>
                            <option :value="1">1小时</option>
                            <option :value="2">2小时</option>
                            <option :value="3">3小时</option>
                        </select>
                        <select v-model="timerMinutes" class="timer-select">
                            <option :value="5">5分钟</option>
                            <option :value="10">10分钟</option>
                            <option :value="15">15分钟</option>
                            <option :value="30">30分钟</option>
                            <option :value="45">45分钟</option>
                        </select>
                        <button class="timer-btn" @click="setTimer">开始定时</button>
                    </div>
                    <div v-else class="timer-active">
                        <button class="timer-btn cancel-btn" @click="cancelTimer">取消定时</button>
                    </div>
                </div>

                <!-- 播放提示 -->
                <div class="tips">
                    <p>💡 添加到主屏幕可获得更好的体验</p>
                    <p>🔒 支持锁屏播放和后台播放</p>
                    <p>🔄 当前曲目会单曲循环播放</p>
                </div>

                <!-- GitHub 链接 -->
                <div class="github-link">
                    <a href="https://github.com/whmmy/baby-sleep-player" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>GitHub: whmmy/baby-sleep-player</span>
                    </a>
                    <p class="star-tip">如果这个项目对你有帮助，请点个 ⭐ Star 支持一下！</p>
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
