document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    // カレンダー表示部分
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearDisplay = document.getElementById('currentMonthYear');
    const monthProfitLossHeader = document.getElementById('monthProfitLossHeader');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');

    // 個別トレード入力フォーム部分
    const tradeDateInput = document.getElementById('tradeDate');
    const tradeTimeInput = document.getElementById('tradeTime');
    const tradePairInput = document.getElementById('tradePair');
    const tradeTypeInput = document.getElementById('tradeType');
    const tradeProfitInput = document.getElementById('tradeProfit');
    const tradeImageUrlInput = document.getElementById('tradeImageUrl');
    const addTradeButton = document.getElementById('addTrade');
    const clearInputFormButton = document.getElementById('clearInputForm');

    // サマリー表示部分
    const totalProfitLossDisplay = document.getElementById('totalProfitLoss');
    const totalWinRateDisplay = document.getElementById('totalWinRate');
    const monthProfitLossDisplay = document.getElementById('monthProfitLoss');
    const monthWinRateDisplay = document.getElementById('monthWinRate');
    const clearAllDataButton = document.getElementById('clearAllData');

    // 個別トレード詳細モーダル (カレンダーの日付クリックで表示される方)
    const tradeDetailsModal = document.getElementById('tradeDetailsModal');
    const closeDetailsModalButton = document.getElementById('closeDetailsModalButton');
    const modalDateHeader = document.getElementById('modalDateHeader');
    const tradeListDisplay = document.getElementById('tradeList');

    // 画像表示専用モーダル
    const imageDisplayModal = document.getElementById('imageDisplayModal');
    const closeImageModalButton = document.getElementById('closeImageModalButton');
    const displayedImage = document.getElementById('displayedImage');

    // --- カレンダーの状態管理 ---
    let currentDisplayDate = new Date();

    // --- データ管理 ---
    let tradeData = {};

    // --- 関数定義 ---

    /**
     * localStorageから取引データを読み込む
     */
    function loadTradeData() {
        try {
            const storedData = localStorage.getItem('fxTradeCalendarData');
            if (storedData) {
                tradeData = JSON.parse(storedData);
            } else {
                // 初回デモデータ (2025年6月, 7月)
                tradeData = {
                    "2025-06-15": [{ time: "10:30", pair: "USDJPY", type: "Buy", profit: 200 }],
                    "2025-06-16": [{ time: "14:00", pair: "USDJPY", type: "Sell", profit: -50 }],
                    "2025-06-19": [{ time: "09:15", pair: "USDJPY", type: "Buy", profit: 192 }],
                    "2025-06-20": [ // 今日のデータ例 (複数トレード)
                        { time: "09:30", pair: "USDJPY", type: "Buy", profit: 150, imageUrl: "https://via.placeholder.com/600x300/28a745/FFFFFF?text=Trade+Chart+1" },
                        { time: "11:00", pair: "USDJPY", type: "Sell", profit: 150 }
                    ],
                    "2025-07-01": [{ time: "09:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-02": [{ time: "10:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-05": [{ time: "11:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-08": [{ time: "12:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-09": [{ time: "13:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-10": [{ time: "14:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-11": [{ time: "15:00", pair: "USDJPY", type: "Sell", profit: -500, imageUrl: "https://via.placeholder.com/600x300/dc3545/FFFFFF?text=Trade+Chart+2" }],
                    "2025-07-12": [
                        { time: "10:00", pair: "USDJPY", type: "Buy", profit: 240 },
                        { time: "11:30", pair: "USDJPY", type: "Buy", profit: 200 }
                    ],
                    "2025-07-16": [{ time: "16:00", pair: "USDJPY", type: "Buy", profit: 400 }],
                    "2025-07-17": [{ time: "17:00", pair: "USDJPY", type: "Sell", profit: -515 }],
                    "2025-07-18": [ // Special day from image
                        { time: "09:00", pair: "USDJPY", type: "Buy", profit: 100 },
                        { time: "10:00", pair: "USDJPY", type: "Buy", profit: 80 },
                        { time: "11:00", pair: "USDJPY", type: "Buy", profit: 120 },
                        { time: "12:00", pair: "USDJPY", type: "Buy", profit: 65 }
                    ],
                    "2025-07-19": [{ time: "09:00", pair: "USDJPY", type: "Buy", profit: 400, imageUrl: "https://via.placeholder.com/600x300/17a2b8/FFFFFF?text=Trade+Chart+3" }],
                };
                saveTradeData();
            }
        } catch (e) {
            console.error("localStorageからのデータ読み込みエラー:", e);
            tradeData = {};
        }
    }

    /**
     * 取引データをlocalStorageに保存する
     */
    function saveTradeData() {
        try {
            localStorage.setItem('fxTradeCalendarData', JSON.stringify(tradeData));
        } catch (e) {
            console.error("localStorageへのデータ保存エラー:", e);
            alert("データの保存に失敗しました。ブラウザのストレージ容量を確認してください。");
        }
    }

    /**
     * 指定された月と年のカレンダーをレンダリングする
     */
    function renderCalendar() {
        calendarGrid.innerHTML = '';

        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();

        currentMonthYearDisplay.textContent = currentDisplayDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long' });

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        // 前月の空白セルを追加
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }

        // 今月の日付セルを追加
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');

            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dailyTrades = tradeData[dateString];

            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayElement.appendChild(dayNumberSpan);

            const tradeDetailsDiv = document.createElement('div');
            tradeDetailsDiv.classList.add('trade-details');

            if (dailyTrades && dailyTrades.length > 0) {
                let totalDailyProfit = 0;
                let dailyTradesCount = dailyTrades.length;

                for (const trade of dailyTrades) {
                    const profit = parseFloat(trade.profit);
                    if (!isNaN(profit)) {
                        totalDailyProfit += profit;
                    }
                }

                const profitLossLine = document.createElement('div');
                profitLossLine.classList.add('trade-profit');
                if (totalDailyProfit >= 0) {
                    profitLossLine.textContent = `+¥${totalDailyProfit.toFixed(0)}`;
                    dayElement.classList.add('profit');
                } else {
                    profitLossLine.textContent = `-¥${Math.abs(totalDailyProfit).toFixed(0)}`;
                    dayElement.classList.add('loss');
                }
                tradeDetailsDiv.appendChild(profitLossLine);

                const tradesCountLine = document.createElement('div');
                tradesCountLine.classList.add('trade-count');
                tradesCountLine.textContent = `${dailyTradesCount} trade${dailyTradesCount > 1 ? 's' : ''}`;
                tradeDetailsDiv.appendChild(tradesCountLine);

                const demoDate = new Date(year, month, day);
                const demoDateString = `${demoDate.getFullYear()}-${String(demoDate.getMonth() + 1).padStart(2, '0')}-${String(demoDate.getDate()).padStart(2, '0')}`;

                if (tradeData[demoDateString] &&
                    (demoDateString === "2025-07-18" || demoDateString === "2025-07-19")) {
                    dayElement.classList.remove('profit', 'loss');
                    if (demoDateString === "2025-07-18") {
                        dayElement.classList.add('date-18');
                    } else if (demoDateString === "2025-07-19") {
                        dayElement.classList.add('date-19');
                    }
                }

            } else {
                // 取引データがない場合
            }

            dayElement.appendChild(tradeDetailsDiv);
            calendarGrid.appendChild(dayElement);

            // 日付セルをクリックして個別トレード詳細を表示
            dayElement.addEventListener('click', () => {
                if (!dayElement.classList.contains('empty')) {
                    displayTradeDetailsModal(dateString);
                }
            });
        }
        updateSummary();
        updateMonthProfitLossHeader();
    }

    /**
     * 今までの損益、勝率、今月の損益、勝率を計算して表示を更新する
     */
    function updateSummary() {
        let totalProfit = 0;
        let totalWins = 0;
        let totalLosses = 0;

        let monthProfit = 0;
        let monthWins = 0;
        let monthLosses = 0;

        const currentMonthString = `${currentDisplayDate.getFullYear()}-${String(currentDisplayDate.getMonth() + 1).padStart(2, '0')}`;

        for (const dateString in tradeData) {
            if (tradeData.hasOwnProperty(dateString) && Array.isArray(tradeData[dateString])) {
                const dailyTrades = tradeData[dateString];
                let dailyProfit = 0;

                for (const trade of dailyTrades) {
                    const profit = parseFloat(trade.profit);
                    if (!isNaN(profit)) {
                        dailyProfit += profit;
                    }
                }

                totalProfit += dailyProfit;
                if (dailyProfit > 0) {
                    totalWins++;
                } else if (dailyProfit < 0) {
                    totalLosses++;
                }

                if (dateString.startsWith(currentMonthString)) {
                    monthProfit += dailyProfit;
                    if (dailyProfit > 0) {
                        monthWins++;
                    } else if (dailyProfit < 0) {
                        monthLosses++;
                    }
                }
            }
        }

        totalProfitLossDisplay.textContent = `${totalProfit >= 0 ? '+' : ''}¥${totalProfit.toFixed(0)}`;
        totalProfitLossDisplay.classList.remove('profit', 'loss');
        if (totalProfit > 0) {
            totalProfitLossDisplay.classList.add('profit');
        } else if (totalProfit < 0) {
            totalProfitLossDisplay.classList.add('loss');
        }

        let totalWinRate = 0;
        if (totalWins + totalLosses > 0) {
            totalWinRate = (totalWins / (totalWins + totalLosses)) * 100;
        }
        totalWinRateDisplay.textContent = `${totalWinRate.toFixed(2)}%`;

        monthProfitLossDisplay.textContent = `${monthProfit >= 0 ? '+' : ''}¥${monthProfit.toFixed(0)}`;
        monthProfitLossDisplay.classList.remove('profit', 'loss');
        if (monthProfit > 0) {
            monthProfitLossDisplay.classList.add('profit');
        } else if (monthProfit < 0) {
            monthProfitLossDisplay.classList.add('loss');
        }

        let monthWinRate = 0;
        if (monthWins + monthLosses > 0) {
            monthWinRate = (monthWins / (monthWins + monthLosses)) * 100;
        }
        monthWinRateDisplay.textContent = `${monthWinRate.toFixed(2)}%`;
    }

    /**
     * カレンダーヘッダーの月の損益表示を更新する
     */
    function updateMonthProfitLossHeader() {
        let currentMonthProfit = 0;
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();
        const currentMonthString = `${year}-${String(month + 1).padStart(2, '0')}`;

        for (const dateString in tradeData) {
            if (tradeData.hasOwnProperty(dateString) && dateString.startsWith(currentMonthString)) {
                const dailyTrades = tradeData[dateString];
                for (const trade of dailyTrades) {
                    const profit = parseFloat(trade.profit);
                    if (!isNaN(profit)) {
                        currentMonthProfit += profit;
                    }
                }
            }
        }

        monthProfitLossHeader.textContent = `今月合計: ${currentMonthProfit >= 0 ? '+' : ''}¥${currentMonthProfit.toFixed(0)}`;
        monthProfitLossHeader.classList.remove('profit', 'loss');
        if (currentMonthProfit > 0) {
            monthProfitLossHeader.classList.add('profit');
        } else if (currentMonthProfit < 0) {
            monthProfitLossHeader.classList.add('loss');
        }
    }


    /**
     * 個別トレード詳細モーダルを表示する (カレンダーの日付クリックで表示)
     * @param {string} dateString - 表示する日付 (YYYY-MM-DD)
     */
    function displayTradeDetailsModal(dateString) {
        modalDateHeader.textContent = `${dateString} のトレード履歴`;
        tradeListDisplay.innerHTML = ''; // 既存の内容をクリア

        const dailyTrades = tradeData[dateString];

        if (dailyTrades && dailyTrades.length > 0) {
            dailyTrades.sort((a, b) => a.time.localeCompare(b.time));

            dailyTrades.forEach(trade => {
                const tradeItem = document.createElement('div');
                tradeItem.classList.add('trade-item');

                // Buy/Sell表示
                const typeIndicator = document.createElement('span');
                typeIndicator.classList.add('type-indicator');
                typeIndicator.classList.add(trade.type.toLowerCase());
                typeIndicator.textContent = trade.type;
                tradeItem.appendChild(typeIndicator);

                // ★ここから変更★ 銘柄情報と画像ボタンをまとめる
                const pairInfoWrapper = document.createElement('div');
                pairInfoWrapper.classList.add('pair-info-wrapper');

                const pairInfo = document.createElement('div');
                pairInfo.classList.add('pair-info');
                const img = document.createElement('img');
                img.src = 'https://widget.oanda.jp/images/instruments/usdjpy.svg';
                img.alt = 'USD/JPY';
                pairInfo.appendChild(img);
                const pairText = document.createElement('span');
                pairText.textContent = trade.pair;
                pairInfo.appendChild(pairText);
                pairInfoWrapper.appendChild(pairInfo); // ラッパーに追加

                if (trade.imageUrl) {
                    const imageButton = document.createElement('button');
                    imageButton.classList.add('image-button');
                    imageButton.textContent = '画像を表示';
                    imageButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showImageModal(trade.imageUrl);
                    });
                    pairInfoWrapper.appendChild(imageButton); // ラッパーに追加
                } else {
                    const imageButtonPlaceholder = document.createElement('button');
                    imageButtonPlaceholder.classList.add('image-button');
                    imageButtonPlaceholder.textContent = '画像なし';
                    imageButtonPlaceholder.disabled = true;
                    pairInfoWrapper.appendChild(imageButtonPlaceholder); // ラッパーに追加
                }
                tradeItem.appendChild(pairInfoWrapper); // トレードアイテムにラッパーを追加
                // ★ここまで変更★

                // 時間表示
                const tradeDateTime = document.createElement('span');
                tradeDateTime.classList.add('trade-datetime');
                tradeDateTime.textContent = `${dateString.replace(/-/g, '/')} ${trade.time}`;
                tradeItem.appendChild(tradeDateTime);

                // 損益表示
                const profitDisplay = document.createElement('span');
                profitDisplay.classList.add('profit-display');
                if (trade.profit >= 0) {
                    profitDisplay.classList.add('positive');
                    profitDisplay.textContent = `+¥${trade.profit.toFixed(0)}`;
                } else {
                    profitDisplay.classList.add('negative');
                    profitDisplay.textContent = `-¥${Math.abs(trade.profit).toFixed(0)}`;
                }
                tradeItem.appendChild(profitDisplay);
                
                // 画像を直接トレードアイテムに表示するロジックは削除
                // if (trade.imageUrl) { /* 削除 */ }

                tradeListDisplay.appendChild(tradeItem);
            });
        } else {
            const noTradeMessage = document.createElement('p');
            noTradeMessage.textContent = 'この日のトレード履歴はありません。';
            noTradeMessage.style.textAlign = 'center';
            noTradeMessage.style.marginTop = '20px';
            noTradeMessage.style.color = '#ccc';
            tradeListDisplay.appendChild(noTradeMessage);
        }

        tradeDetailsModal.style.display = 'flex';
    }

    /**
     * 画像表示専用モーダルを表示する
     * @param {string} imageUrl - 表示する画像のURL
     */
    function showImageModal(imageUrl) {
        displayedImage.src = imageUrl;
        imageDisplayModal.style.display = 'flex';
    }

    /**
     * 個別トレード詳細モーダルを閉じる
     */
    function closeTradeDetailsModal() {
        tradeDetailsModal.style.display = 'none';
    }

    /**
     * 画像表示専用モーダルを閉じる
     */
    function closeImageDisplayModal() {
        imageDisplayModal.style.display = 'none';
        displayedImage.src = '';
    }

    /**
     * 新しい個別トレードデータを追加する
     */
    function addTrade() {
        const tradeDate = tradeDateInput.value;
        const tradeTime = tradeTimeInput.value;
        const tradePair = tradePairInput.value;
        const tradeType = tradeTypeInput.value;
        const tradeProfit = parseFloat(tradeProfitInput.value);
        const tradeImageUrl = tradeImageUrlInput.value.trim();

        // バリデーション
        if (!tradeDate || !tradeTime || !tradePair || !tradeType || isNaN(tradeProfit)) {
            alert('日付、時間、銘柄、タイプ、損益を正しく入力してください。');
            return;
        }

        const yearPart = tradeDate.substring(0, 4);
        if (yearPart.length !== 4) {
            alert('日付の年は4桁で入力してください。');
            return;
        }
        const checkDate = new Date(tradeDate);
        if (isNaN(checkDate.getTime())) {
            alert('有効な日付を入力してください。');
            return;
        }

        if (!tradeData[tradeDate]) {
            tradeData[tradeDate] = [];
        }

        tradeData[tradeDate].push({
            time: tradeTime,
            pair: tradePair,
            type: tradeType,
            profit: tradeProfit,
            imageUrl: tradeImageUrl || undefined
        });

        saveTradeData();
        
        const [year, month] = tradeDate.split('-').map(Number);
        currentDisplayDate.setFullYear(year);
        currentDisplayDate.setMonth(month - 1);
        renderCalendar();

        clearTradeInputForm();
    }

    /**
     * 個別トレード入力フォームをクリアする
     */
    function clearTradeInputForm() {
        tradeDateInput.value = '';
        tradeTimeInput.value = '';
        tradePairInput.value = 'USDJPY';
        tradeTypeInput.value = 'Buy';
        tradeProfitInput.value = '';
        tradeImageUrlInput.value = '';
    }

    /**
     * 保存されている全ての取引データをクリアする
     */
    function clearAllStoredData() {
        if (confirm('本当に全ての取引履歴をクリアしますか？この操作は元に戻せません。')) {
            localStorage.removeItem('fxTradeCalendarData');
            tradeData = {};
            renderCalendar();
        }
    }

    // --- イベントリスナーの設定 ---

    prevMonthButton.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        renderCalendar();
    });

    addTradeButton.addEventListener('click', addTrade);
    clearInputFormButton.addEventListener('click', clearTradeInputForm);
    clearAllDataButton.addEventListener('click', clearAllStoredData);

    closeDetailsModalButton.addEventListener('click', closeTradeDetailsModal);
    tradeDetailsModal.addEventListener('click', (event) => {
        if (event.target === tradeDetailsModal) {
            closeTradeDetailsModal();
        }
    });

    closeImageModalButton.addEventListener('click', closeImageDisplayModal);
    imageDisplayModal.addEventListener('click', (event) => {
        if (event.target === imageDisplayModal) {
            closeImageDisplayModal();
        }
    });


    // --- 初期化処理 ---
    loadTradeData();
    renderCalendar();
});