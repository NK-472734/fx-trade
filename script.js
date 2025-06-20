// Firebaseの初期化はindex.htmlで行われているため、ここではグローバル変数として利用します
// const auth = firebase.auth();
// const db = firebase.firestore();

// UI要素の取得
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYearHeader = document.getElementById('currentMonthYear');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const monthProfitLossHeader = document.getElementById('monthProfitLossHeader');

const tradeDateInput = document.getElementById('tradeDate');
const tradeTimeInput = document.getElementById('tradeTime');
const tradePairSelect = document.getElementById('tradePair');
const tradeTypeSelect = document.getElementById('tradeType');
const tradeProfitInput = document.getElementById('tradeProfit');
const tradeImageUrlInput = document.getElementById('tradeImageUrl');
const addTradeButton = document.getElementById('addTrade');
const clearInputFormButton = document.getElementById('clearInputForm');

const totalProfitLossDisplay = document.getElementById('totalProfitLoss');
const totalWinRateDisplay = document.getElementById('totalWinRate');
const monthProfitLossDisplay = document.getElementById('monthProfitLoss');
const monthWinRateDisplay = document.getElementById('monthWinRate');
const clearAllDataButton = document.getElementById('clearAllData');

const tradeDetailsModal = document.getElementById('tradeDetailsModal');
const closeDetailsModalButton = document.getElementById('closeDetailsModalButton');
const modalDateHeader = document.getElementById('modalDateHeader');
const tradeListContainer = document.getElementById('tradeList');

const imageDisplayModal = document.getElementById('imageDisplayModal');
const closeImageModalButton = document.getElementById('closeImageModalButton');
const displayedImage = document.getElementById('displayedImage');

// 認証関連UI
const userStatusSpan = document.getElementById('userStatus');
const googleSignInButton = document.getElementById('googleSignInButton');
const anonymousSignInButton = document.getElementById('anonymousSignInButton');
const signOutButton = document.getElementById('signOutButton');

let currentDisplayedDate = new Date();
let trades = []; // 全トレードデータを保持する配列（Firestoreから取得）
let currentUserId = null; // 現在ログインしているユーザーのID

// =====================================================================
// 認証関連の処理
// =====================================================================

// 認証状態の変化を監視
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        userStatusSpan.textContent = `ログイン中: ${user.displayName || '匿名ユーザー'}`;
        googleSignInButton.style.display = 'none';
        anonymousSignInButton.style.display = 'none';
        signOutButton.style.display = 'inline-block';
        addTradeButton.disabled = false; // ログインしたらトレード追加を有効化
        clearAllDataButton.disabled = false; // ログインしたら全データクリアを有効化
        fetchTrades(); // ログインしたらデータを取得
    } else {
        currentUserId = null;
        userStatusSpan.textContent = 'ログインしていません';
        googleSignInButton.style.display = 'inline-block';
        anonymousSignInButton.style.display = 'inline-block';
        signOutButton.style.display = 'none';
        addTradeButton.disabled = true; // ログアウトしたらトレード追加を無効化
        clearAllDataButton.disabled = true; // ログアウトしたら全データクリアを無効化
        trades = []; // ログアウトしたらデータをクリア
        renderCalendar(); // カレンダーを再描画（データなしの状態に）
        updateSummaries(); // サマリーをクリア
    }
});

// Googleログイン
googleSignInButton.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Googleログインエラー:", error);
        alert("Googleログインに失敗しました: " + error.message);
    }
});

// 匿名ログイン
anonymousSignInButton.addEventListener('click', async () => {
    try {
        await auth.signInAnonymously();
    } catch (error) {
        console.error("匿名ログインエラー:", error);
        alert("匿名ログインに失敗しました: " + error.message);
    }
});

// ログアウト
signOutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("ログアウトエラー:", error);
        alert("ログアウトに失敗しました: " + error.message);
    }
});

// =====================================================================
// Firebase Firestore データ操作
// =====================================================================

// Firestoreからトレードデータを取得
async function fetchTrades() {
    if (!currentUserId) {
        trades = []; // ユーザーがいない場合はデータをクリア
        renderCalendar();
        updateSummaries();
        return;
    }

    // ユーザーごとのコレクションからデータを取得
    // リアルタイムリスナーを設定し、データが変更されるたびに更新
    db.collection('users').doc(currentUserId).collection('trades')
        .orderBy('timestamp', 'asc') // 日付順にソート
        .onSnapshot(snapshot => {
            trades = snapshot.docs.map(doc => ({
                id: doc.id, // ドキュメントIDを保存
                ...doc.data(),
                // FirestoreのTimestampをJavaScriptのDateオブジェクトに変換
                date: doc.data().timestamp ? doc.data().timestamp.toDate().toISOString().split('T')[0] : '',
                time: doc.data().timestamp ? doc.data().timestamp.toDate().toTimeString().split(' ')[0].substring(0, 5) : ''
            }));
            console.log("Fetched trades:", trades);
            renderCalendar();
            updateSummaries();
        }, error => {
            console.error("Error fetching trades: ", error);
            alert("データの取得中にエラーが発生しました。");
        });
}

// トレードデータをFirestoreに追加
async function addTradeToFirestore(trade) {
    if (!currentUserId) {
        alert("ログインしていません。トレードを追加できません。");
        return;
    }
    try {
        // FirestoreのTimestamp型に変換
        const tradeTimestamp = new Date(`${trade.date}T${trade.time}`);
        const docRef = await db.collection('users').doc(currentUserId).collection('trades').add({
            pair: trade.pair,
            type: trade.type,
            profit: trade.profit,
            imageUrl: trade.imageUrl,
            timestamp: firebase.firestore.Timestamp.fromDate(tradeTimestamp) // Timestampで保存
        });
        console.log("Document written with ID: ", docRef.id);
        alert("トレードが追加されました！");
        clearInputForm();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("トレードの追加に失敗しました。");
    }
}

// Firestoreからトレードデータを削除
async function deleteTradeFromFirestore(tradeId) {
    if (!currentUserId) {
        alert("ログインしていません。トレードを削除できません。");
        return;
    }
    if (!confirm("このトレードを本当に削除しますか？")) {
        return;
    }
    try {
        await db.collection('users').doc(currentUserId).collection('trades').doc(tradeId).delete();
        console.log("Document successfully deleted!");
        alert("トレードが削除されました。");
        tradeDetailsModal.style.display = 'none'; // モーダルを閉じる
    } catch (error) {
        console.error("Error removing document: ", error);
        alert("トレードの削除に失敗しました。");
    }
}

// Firestoreの全トレードデータを削除 (注意: ユーザーの全データを削除します)
async function clearAllTradesFromFirestore() {
    if (!currentUserId) {
        alert("ログインしていません。データをクリアできません。");
        return;
    }
    if (!confirm("全てのトレード履歴を削除しますか？この操作は元に戻せません。")) {
        return;
    }

    try {
        const batch = db.batch();
        const snapshot = await db.collection('users').doc(currentUserId).collection('trades').get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert("全てのトレード履歴がクリアされました。");
        tradeDetailsModal.style.display = 'none'; // モーダルを閉じる
    } catch (error) {
        console.error("Error clearing all trades: ", error);
        alert("全てのトレード履歴のクリアに失敗しました。");
    }
}

// =====================================================================
// カレンダー描画とサマリー計算
// =====================================================================

function renderCalendar() {
    calendarGrid.innerHTML = ''; // カレンダーをクリア

    const year = currentDisplayedDate.getFullYear();
    const month = currentDisplayedDate.getMonth(); // 0-11

    currentMonthYearHeader.textContent = `${year}年 ${month + 1}月`;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // 曜日に応じて空白セルを追加
    const startDay = firstDayOfMonth.getDay(); // 0:日, 1:月, ..., 6:土
    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // 各日付のセルを生成
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = day;
        dayDiv.appendChild(dayNumberSpan);

        // その日のトレードをフィルタリング
        const dailyTrades = trades.filter(trade => {
            const tradeDate = trade.date; // YYYY-MM-DD形式
            const currentDay = dayDiv.dataset.date;
            return tradeDate === currentDay;
        });

        // その日の損益を計算
        const dailyProfit = dailyTrades.reduce((sum, trade) => sum + parseFloat(trade.profit), 0);

        if (dailyTrades.length > 0) {
            const tradeDetailsDiv = document.createElement('div');
            tradeDetailsDiv.classList.add('trade-details');

            const profitSpan = document.createElement('span');
            profitSpan.classList.add('trade-profit');
            profitSpan.textContent = `損益: ${dailyProfit.toLocaleString()}円`;
            profitSpan.classList.add(dailyProfit >= 0 ? 'profit' : 'loss'); // 色分け
            tradeDetailsDiv.appendChild(profitSpan);

            const countSpan = document.createElement('span');
            countSpan.classList.add('trade-count');
            countSpan.textContent = `(${dailyTrades.length}件)`;
            tradeDetailsDiv.appendChild(countSpan);

            dayDiv.appendChild(tradeDetailsDiv);

            // 日付セルに損益クラスを追加
            if (dailyProfit > 0) {
                dayDiv.classList.add('profit');
            } else if (dailyProfit < 0) {
                dayDiv.classList.add('loss');
            }
        }

        // 日付クリックでモーダル表示
        dayDiv.addEventListener('click', () => showTradeDetails(dayDiv.dataset.date));

        calendarGrid.appendChild(dayDiv);
    }

    updateMonthSummaryHeader(); // 月のサマリーヘッダーを更新
}

function updateMonthSummaryHeader() {
    const year = currentDisplayedDate.getFullYear();
    const month = currentDisplayedDate.getMonth();

    const monthTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

    const monthProfit = monthTrades.reduce((sum, trade) => sum + parseFloat(trade.profit), 0);

    monthProfitLossHeader.textContent = `今月の損益: ${monthProfit.toLocaleString()}円`;
    monthProfitLossHeader.classList.remove('profit', 'loss');
    if (monthProfit > 0) {
        monthProfitLossHeader.classList.add('profit');
    } else if (monthProfit < 0) {
        monthProfitLossHeader.classList.add('loss');
    }
}


function updateSummaries() {
    // 全期間の損益と勝率
    const totalProfit = trades.reduce((sum, trade) => sum + parseFloat(trade.profit), 0);
    const totalWins = trades.filter(trade => parseFloat(trade.profit) > 0).length;
    const totalLosses = trades.filter(trade => parseFloat(trade.profit) < 0).length;
    const totalTrades = trades.length;
    const totalWinRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(2) : 0;

    totalProfitLossDisplay.textContent = `${totalProfit.toLocaleString()}円`;
    totalProfitLossDisplay.classList.remove('profit', 'loss');
    if (totalProfit > 0) {
        totalProfitLossDisplay.classList.add('profit');
    } else if (totalProfit < 0) {
        totalProfitLossDisplay.classList.add('loss');
    }

    totalWinRateDisplay.textContent = `${totalWinRate}%`;

    // 今月の損益と勝率
    const currentMonth = currentDisplayedDate.getMonth();
    const currentYear = currentDisplayedDate.getFullYear();

    const monthTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
    });

    const monthProfit = monthTrades.reduce((sum, trade) => sum + parseFloat(trade.profit), 0);
    const monthWins = monthTrades.filter(trade => parseFloat(trade.profit) > 0).length;
    const monthTradesCount = monthTrades.length;
    const monthWinRate = monthTradesCount > 0 ? (monthWins / monthTradesCount * 100).toFixed(2) : 0;

    monthProfitLossDisplay.textContent = `${monthProfit.toLocaleString()}円`;
    monthProfitLossDisplay.classList.remove('profit', 'loss');
    if (monthProfit > 0) {
        monthProfitLossDisplay.classList.add('profit');
    } else if (monthProfit < 0) {
        monthProfitLossDisplay.classList.add('loss');
    }
    monthWinRateDisplay.textContent = `${monthWinRate}%`;
}


// =====================================================================
// イベントリスナー
// =====================================================================

prevMonthButton.addEventListener('click', () => {
    currentDisplayedDate.setMonth(currentDisplayedDate.getMonth() - 1);
    renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
    currentDisplayedDate.setMonth(currentDisplayedDate.getMonth() + 1);
    renderCalendar();
});

addTradeButton.addEventListener('click', () => {
    if (!currentUserId) {
        alert("トレードを追加するにはログインしてください。");
        return;
    }

    const date = tradeDateInput.value;
    const time = tradeTimeInput.value;
    const pair = tradePairSelect.value;
    const type = tradeTypeSelect.value;
    const profit = parseFloat(tradeProfitInput.value);
    const imageUrl = tradeImageUrlInput.value;

    if (!date || !time || !pair || !type || isNaN(profit)) {
        alert('日付、時間、銘柄、タイプ、損益は必須項目です。');
        return;
    }

    const newTrade = { date, time, pair, type, profit, imageUrl };
    addTradeToFirestore(newTrade);
});

clearInputFormButton.addEventListener('click', clearInputForm);

clearAllDataButton.addEventListener('click', clearAllTradesFromFirestore);


// =====================================================================
// モーダル関連
// =====================================================================

function showTradeDetails(date) {
    modalDateHeader.textContent = `${date}のトレード履歴`;
    tradeListContainer.innerHTML = ''; // 既存のリストをクリア

    const dailyTrades = trades.filter(trade => trade.date === date);

    if (dailyTrades.length === 0) {
        const noTradeMessage = document.createElement('p');
        noTradeMessage.textContent = 'この日のトレード履歴はありません。';
        tradeListContainer.appendChild(noTradeMessage);
    } else {
        dailyTrades.forEach(trade => {
            const tradeItem = document.createElement('div');
            tradeItem.classList.add('trade-item');

            const typeIndicator = document.createElement('span');
            typeIndicator.classList.add('type-indicator', trade.type.toLowerCase());
            typeIndicator.textContent = trade.type;
            tradeItem.appendChild(typeIndicator);

            const pairInfoWrapper = document.createElement('div');
            pairInfoWrapper.classList.add('pair-info-wrapper');

            const pairInfo = document.createElement('span');
            pairInfo.classList.add('pair-info');
            // 銘柄アイコンは一旦省略
            pairInfo.textContent = trade.pair;
            pairInfoWrapper.appendChild(pairInfo);

            // 画像表示ボタン
            const imageButton = document.createElement('button');
            imageButton.classList.add('image-button');
            imageButton.textContent = '画像を見る';
            imageButton.disabled = !trade.imageUrl; // URLがない場合は無効化
            if (trade.imageUrl) {
                imageButton.addEventListener('click', () => {
                    displayedImage.src = trade.imageUrl;
                    imageDisplayModal.style.display = 'flex';
                });
            }
            pairInfoWrapper.appendChild(imageButton);
            tradeItem.appendChild(pairInfoWrapper);


            const dateTimeSpan = document.createElement('span');
            dateTimeSpan.classList.add('trade-datetime');
            dateTimeSpan.textContent = `${trade.time}`; // 日付はヘッダーにあるため時間のみ
            tradeItem.appendChild(dateTimeSpan);

            const profitDisplay = document.createElement('span');
            profitDisplay.classList.add('profit-display');
            profitDisplay.textContent = `${trade.profit.toLocaleString()}円`;
            profitDisplay.classList.add(trade.profit >= 0 ? 'positive' : 'negative');
            tradeItem.appendChild(profitDisplay);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('action-button', 'clear-button'); // 既存のスタイルを流用
            deleteButton.textContent = '削除';
            deleteButton.style.marginLeft = 'auto'; // 右端に寄せる
            deleteButton.addEventListener('click', () => deleteTradeFromFirestore(trade.id)); // Firebaseから削除
            tradeItem.appendChild(deleteButton);


            tradeListContainer.appendChild(tradeItem);
        });
    }

    tradeDetailsModal.style.display = 'flex'; // モーダルを表示
}

closeDetailsModalButton.addEventListener('click', () => {
    tradeDetailsModal.style.display = 'none';
});

closeImageModalButton.addEventListener('click', () => {
    imageDisplayModal.style.display = 'none';
    displayedImage.src = ''; // 画像をクリア
});

// モーダルの外側をクリックで閉じる
window.addEventListener('click', (event) => {
    if (event.target === tradeDetailsModal) {
        tradeDetailsModal.style.display = 'none';
    }
    if (event.target === imageDisplayModal) {
        imageDisplayModal.style.display = 'none';
    }
});


// =====================================================================
// ヘルパー関数
// =====================================================================

function clearInputForm() {
    tradeDateInput.value = '';
    tradeTimeInput.value = '';
    tradePairSelect.value = 'USDJPY';
    tradeTypeSelect.value = 'Buy';
    tradeProfitInput.value = '';
    tradeImageUrlInput.value = '';
}

// =====================================================================
// 初期化処理
// =====================================================================

// ページロード時に現在の日付をセット
const today = new Date();
tradeDateInput.value = today.toISOString().split('T')[0];
tradeTimeInput.value = today.toTimeString().split(' ')[0].substring(0, 5);

// 認証状態に応じて初期表示を調整
// onAuthStateChangedが呼ばれるまで待つため、ここではfetchTradesを呼ばない

// =====================================================================
// ★ローカルストレージ関連のコード（サーバー移行後は基本的に不要）★
// =====================================================================

// データエクスポート機能 (localStorageからJSONとしてエクスポート)
const exportDataButton = document.getElementById('exportDataButton');
exportDataButton.addEventListener('click', () => {
    // 現在のtrades配列をJSON形式でエクスポート
    const dataStr = JSON.stringify(trades, null, 2); // 整形して出力
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fx_trade_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('データがエクスポートされました。');
});

// データインポート機能 (JSONファイルを読み込みlocalStorageに保存)
const importFileInput = document.getElementById('importFileInput');
const importDataButton = document.getElementById('importDataButton');

importDataButton.addEventListener('click', () => {
    if (importFileInput.files.length === 0) {
        alert('インポートするファイルを選択してください。');
        return;
    }

    const file = importFileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const importedTrades = JSON.parse(e.target.result);

            if (!Array.isArray(importedTrades)) {
                alert('無効なJSON形式です。配列形式のデータが必要です。');
                return;
            }

            if (!currentUserId) {
                alert("ログインしていません。データをインポートできません。");
                return;
            }

            // 既存のデータをクリアするか確認
            if (!confirm("既存のトレード履歴を上書きしてインポートしますか？")) {
                return;
            }

            // まず既存のユーザーのデータを全て削除
            const batch = db.batch();
            const snapshot = await db.collection('users').doc(currentUserId).collection('trades').get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // インポートしたデータをFirestoreに追加
            const newBatch = db.batch();
            importedTrades.forEach(trade => {
                // 日付と時間を結合してDateオブジェクトを作成し、Timestampに変換
                const tradeTimestamp = new Date(`${trade.date}T${trade.time}`);
                const docRef = db.collection('users').doc(currentUserId).collection('trades').doc(); // 新しいドキュメントIDを生成
                newBatch.set(docRef, {
                    pair: trade.pair,
                    type: trade.type,
                    profit: trade.profit,
                    imageUrl: trade.imageUrl || '', // URLがない場合を考慮
                    timestamp: firebase.firestore.Timestamp.fromDate(tradeTimestamp)
                });
            });
            await newBatch.commit();

            alert('データが正常にインポートされました！');
            // FirestoreのonSnapshotリスナーが自動的にデータを再読み込みし、UIを更新します
            importFileInput.value = ''; // ファイル選択をクリア
        } catch (error) {
            console.error('データのインポート中にエラーが発生しました:', error);
            alert('データのインポートに失敗しました。ファイル形式を確認してください。');
        }
    };

    reader.readAsText(file);
});

// =====================================================================
// 初期カレンダー描画 (認証状態に応じてfetchTradesが呼ばれるため、ここでは呼ばない)
// =====================================================================
// renderCalendar(); // onAuthStateChangedで呼ばれる