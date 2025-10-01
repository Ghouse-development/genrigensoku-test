import { allQuizzes } from './quizData.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- Supabase Configuration ---
// 環境変数から取得（本番環境用）
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '';

// Supabaseクライアントの初期化
let supabase = null;

// --- App State ---
let originalUserName = '';
let isSupabaseInitialized = false;

// --- DOM Elements ---
const appContainer = document.getElementById('app-container');
const homePage = document.getElementById('home-page');
const quizPage = document.getElementById('quiz-page');
const resultPage = document.getElementById('result-page');
const dashboardPage = document.getElementById('dashboard-page');
const nameInput = document.getElementById('name-input');
const quizSelectionDiv = document.getElementById('quiz-selection');

// --- Utility Functions ---
const normalizeName = (name) => (name || '').trim().replace(/\s|　/g, '');

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
};

const goHome = () => {
    nameInput.value = originalUserName;
    checkNameAndEnableButtons();
    showPage('home-page');
};

const checkNameAndEnableButtons = () => {
    const hasName = nameInput.value.trim() !== '';
    document.querySelectorAll('.start-quiz-button').forEach(button => button.disabled = !hasName);
};

// --- Supabase Logic ---
function initializeSupabase() {
    if (isSupabaseInitialized && supabase) {
        return { success: true };
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase configuration is missing');
        return { success: false, error: 'Supabase設定が不完全です' };
    }

    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseInitialized = true;
        console.log('Supabase initialized successfully');
        return { success: true };
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        supabase = null;
        isSupabaseInitialized = false;
        return { success: false, error: error.message };
    }
}

async function saveResultToSupabase(result) {
    if (!supabase) {
        console.error('Supabase is not available');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .insert([result]);

        if (error) throw error;
        console.log('Result saved successfully:', data);
    } catch (error) {
        console.error('Error saving result:', error);
    }
}

async function fetchDashboardData() {
    if (!supabase) {
        return { success: false, error: 'Supabaseが利用できません' };
    }

    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // データを集計
        const userData = {};
        data.forEach(res => {
            const key = res.normalized_user_name || normalizeName(res.user_name);
            if (!key) return;

            if (!userData[key]) {
                userData[key] = {
                    name: res.user_name,
                    normalizedName: key,
                    totalAttempts: 0,
                    lastAttempt: null,
                    quizzes: {}
                };
            }

            const user = userData[key];
            user.totalAttempts++;

            // 最新の受験日時を更新
            if (!user.lastAttempt || new Date(res.created_at) > new Date(user.lastAttempt)) {
                user.lastAttempt = res.created_at;
                user.name = res.user_name;
            }

            // クイズ別統計を更新
            if (!user.quizzes[res.quiz_id]) {
                user.quizzes[res.quiz_id] = {
                    title: res.quiz_title,
                    attempts: 0,
                    highestScore: 0
                };
            }
            const quizStat = user.quizzes[res.quiz_id];
            quizStat.attempts++;
            if (res.percentage > quizStat.highestScore) {
                quizStat.highestScore = res.percentage;
            }
        });

        return { success: true, data: Object.values(userData) };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return { success: false, error: error.message };
    }
}

// --- Rendering Functions ---
function renderHomePage() {
    quizSelectionDiv.innerHTML = '<h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">テストを選択してください</h2>';
    const quizOrder = ["quiz1", "quiz2", "quiz3", "quiz4", "quiz5", "quiz6", "quiz7", "quiz8", "quiz9", "quiz10", "quiz11", "summary"];

    quizOrder.forEach(quizId => {
        const quiz = allQuizzes[quizId];
        if (!quiz) return;
        const card = document.createElement('div');
        card.className = 'p-4 border rounded-lg bg-white hover:shadow-md transition-shadow flex justify-between items-center';
        card.innerHTML = `
            <div>
                <h3 class="font-bold text-lg text-gray-800">${quiz.title}</h3>
                <p class="text-sm text-gray-500">${quiz.questions.length}問</p>
            </div>
            <button data-quiz-id="${quizId}" class="start-quiz-button bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold" disabled>
                開始
            </button>
        `;
        quizSelectionDiv.appendChild(card);
    });
    checkNameAndEnableButtons();
}

function renderQuizPage(quizId, quizData, takerName) {
    quizPage.innerHTML = `
        <header class="text-center mb-6">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800 pb-2">${allQuizzes[quizId].title}</h1>
            <p class="mt-2 text-gray-600">${takerName}さんの挑戦</p>
        </header>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-8">
            <div id="progress-bar" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%; transition: width 0.3s ease-in-out;"></div>
        </div>
        <div id="quiz-body"></div>
    `;
}

function renderQuestion(quizData, index) {
    const quiz = quizData[index];
    const quizBody = document.getElementById('quiz-body');
    if (!quizBody) return;

    const optionsHtml = quiz.options.map((option, i) => `
        <div>
            <input type="radio" name="question${index}" id="q${index}o${i}" value="${i}" class="hidden peer">
            <label for="q${index}o${i}" class="option-label block w-full text-left p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                <span class="font-bold mr-2">${String.fromCharCode(65 + i)}.</span> ${option}
            </label>
        </div>`).join('');

    quizBody.innerHTML = `
        <div class="bg-white p-6 md:p-8 rounded-lg shadow-xl">
            <h3 class="text-xl md:text-2xl font-bold mb-2">問 ${index + 1} / ${quizData.length}</h3>
            <p class="text-lg md:text-xl text-gray-800 mb-6">${quiz.question}</p>
            <div class="space-y-4 mb-8">${optionsHtml}</div>
            <div class="feedback border-l-4 p-4 mb-6"></div>
            <button class="check-answer-btn w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold" disabled>
                解答を確定する
            </button>
            <button class="next-question-btn w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold" style="display: none;">
                ${index === quizData.length - 1 ? '結果を見る' : '次の問題へ'}
            </button>
        </div>
    `;
}

function renderResultPage(score, total, percentage) {
    let feedback = '';
    if (percentage === 100) feedback = '完璧です！あなたは全ての原理原則を完全に理解しています。素晴らしい！';
    else if (percentage >= 80) feedback = '極めて優秀です！大部分を理解されています。間違えた箇所を再読すれば完璧です。';
    else if (percentage >= 50) feedback = '合格ラインです。しかし、まだ理解が曖昧な部分があります。重点的に復習しましょう。';
    else feedback = '伸びしろ十分！もう一度、資料をじっくり読み込み、再挑戦してみてください。';

    resultPage.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 class="text-2xl font-bold mb-4">結果発表</h2>
            <p class="text-4xl font-bold my-6">${total}問中 ${score}問 正解！ (${percentage}%)</p>
            <p class="text-lg text-gray-700 mb-8">${feedback}</p>
            <div class="flex space-x-4">
                <button id="dashboard-btn-result" class="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-lg font-semibold">
                    ダッシュボードへ
                </button>
                <button id="gohome-btn-result" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
                    ホームに戻る
                </button>
            </div>
        </div>
    `;
}

function renderDashboardPage(userData) {
    dashboardPage.innerHTML = `
        <header class="text-center mb-6">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">学習状況ダッシュボード</h1>
        </header>
        <div class="bg-white p-6 rounded-lg shadow-xl overflow-x-auto">
            <div id="dashboard-content"></div>
        </div>
        <div class="text-center mt-8">
            <button id="gohome-btn-dash" class="bg-blue-600 text-white py-2 px-8 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
                ホームに戻る
            </button>
        </div>
    `;

    const contentDiv = document.getElementById('dashboard-content');

    if (!userData || userData.length === 0) {
        contentDiv.innerHTML = `<p class="text-center text-gray-500 mt-4">まだ受験履歴がありません。</p>`;
        return;
    }

    const quizOrder = ["quiz1", "quiz2", "quiz3", "quiz4", "quiz5", "quiz6", "quiz7", "quiz8", "quiz9", "quiz10", "quiz11", "summary"];
    const quizHeaders = quizOrder.map(id => allQuizzes[id] ? `<th class="p-3 text-sm font-semibold tracking-wide text-left">${allQuizzes[id].title.replace('原理原則テスト', 'テ')}</th>` : '').join('');

    const tableRows = userData.map(user => {
        let totalScore = 0;
        let testedQuizCount = 0;

        const quizCells = quizOrder.map(quizId => {
            const quizResult = user.quizzes[quizId];
            if (quizResult) {
                totalScore += quizResult.highestScore;
                testedQuizCount++;
                return `<td class="p-3 text-gray-700">${quizResult.highestScore}%<span class="text-xs text-gray-500">(${quizResult.attempts})</span></td>`;
            }
            return `<td class="p-3 text-gray-400">-</td>`;
        }).join('');

        const proficiency = testedQuizCount > 0 ? Math.round(totalScore / testedQuizCount) : 0;
        let proficiencyClass = '';
        if (proficiency >= 80) proficiencyClass = 'bg-green-200 text-green-800';
        else if (proficiency >= 50) proficiencyClass = 'bg-yellow-200 text-yellow-800';
        else if (testedQuizCount > 0) proficiencyClass = 'bg-red-200 text-red-800';

        const lastAttemptDate = user.lastAttempt ? new Date(user.lastAttempt).toLocaleString('ja-JP') : 'N/A';

        return `
            <tr class="bg-white hover:bg-gray-50">
                <td class="p-3 font-bold text-gray-700">${user.name}</td>
                <td class="p-3 text-gray-700 text-center">${user.totalAttempts}</td>
                ${quizCells}
                <td class="p-3 font-bold">
                    <span class="p-1.5 text-xs font-medium uppercase tracking-wider ${proficiencyClass} rounded-lg bg-opacity-50">${proficiency}%</span>
                </td>
                <td class="p-3 text-gray-700">${lastAttemptDate}</td>
            </tr>`;
    }).join('');

    contentDiv.innerHTML = `
        <table class="w-full text-sm mt-4">
            <thead class="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                    <th class="p-3 font-semibold tracking-wide text-left">利用者名</th>
                    <th class="p-3 font-semibold tracking-wide text-left">総回数</th>
                    ${quizHeaders}
                    <th class="p-3 font-semibold tracking-wide text-left">総合習熟度</th>
                    <th class="p-3 font-semibold tracking-wide text-left">最終受験日</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${tableRows}</tbody>
        </table>`;
}

// --- Quiz Logic ---
function runQuiz(quizId) {
    originalUserName = nameInput.value.trim();
    const normalizedUserName = normalizeName(originalUserName);
    if (!normalizedUserName) {
        alert('お名前を入力してください。');
        return;
    }

    const quizData = allQuizzes[quizId].questions;
    let currentQuestionIndex = 0;
    let userScore = 0;

    renderQuizPage(quizId, quizData, originalUserName);
    renderQuestion(quizData, currentQuestionIndex);
    showPage('quiz-page');

    quizPage.onclick = (e) => {
        const target = e.target;
        const checkBtn = quizPage.querySelector('.check-answer-btn');

        if (target.name === `question${currentQuestionIndex}`) {
            checkBtn.disabled = false;
        }

        if (target.classList.contains('check-answer-btn') && !target.disabled) {
            const selectedOption = quizPage.querySelector(`input[name="question${currentQuestionIndex}"]:checked`);
            const selectedValue = parseInt(selectedOption.value);
            const correctAnswer = quizData[currentQuestionIndex].answer;

            const feedbackDiv = quizPage.querySelector('.feedback');
            const optionsContainer = selectedOption.closest('.space-y-4');

            Array.from(optionsContainer.children).forEach((child, i) => {
                child.querySelector('input').disabled = true;
                if (i === correctAnswer) child.querySelector('label').classList.add('correct-answer');
                if (selectedValue === i && selectedValue !== correctAnswer) child.querySelector('label').classList.add('incorrect-answer');
            });

            if (selectedValue === correctAnswer) {
                feedbackDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 text-green-700">正解！</h4><p>${quizData[currentQuestionIndex].explanation}</p>`;
                feedbackDiv.classList.add('border-green-500', 'bg-green-50');
                userScore++;
            } else {
                feedbackDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 text-red-700">不正解...</h4><p>${quizData[currentQuestionIndex].explanation}</p>`;
                feedbackDiv.classList.add('border-red-500', 'bg-red-50');
            }
            feedbackDiv.style.display = 'block';

            target.style.display = 'none';
            quizPage.querySelector('.next-question-btn').style.display = 'block';

            const progressBar = document.getElementById('progress-bar');
            progressBar.style.width = `${((currentQuestionIndex + 1) / quizData.length) * 100}%`;
        }

        if (target.classList.contains('next-question-btn')) {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                renderQuestion(quizData, currentQuestionIndex);
            } else {
                const percentage = Math.round((userScore / quizData.length) * 100);
                renderResultPage(userScore, quizData.length, percentage);
                showPage('result-page');
                saveResultToSupabase({
                    user_name: originalUserName,
                    normalized_user_name: normalizedUserName,
                    quiz_id: quizId,
                    quiz_title: allQuizzes[quizId].title,
                    score: userScore,
                    total_questions: quizData.length,
                    percentage: percentage
                });
            }
        }
    };
}

async function showDashboard() {
    showPage('dashboard-page');

    dashboardPage.innerHTML = `
        <header class="text-center mb-6">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">学習状況ダッシュボード</h1>
        </header>
        <div class="bg-white p-6 rounded-lg shadow-xl">
            <div class="loader"></div>
            <p class="text-center text-gray-500">データを読み込んでいます...</p>
        </div>
        <div class="text-center mt-8">
            <button id="gohome-btn-dash" class="bg-blue-600 text-white py-2 px-8 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
                ホームに戻る
            </button>
        </div>
    `;

    const initResult = initializeSupabase();
    if (!initResult.success) {
        renderDashboardPage(null);
        const contentDiv = document.getElementById('dashboard-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="text-center text-red-500 mt-4">
                    <h3 class="text-lg font-bold mb-2">データベース接続エラー</h3>
                    <p>Supabase の設定を確認してください。</p>
                    <p class="text-sm mt-2">エラー: ${initResult.error}</p>
                </div>
            `;
        }
        return;
    }

    const result = await fetchDashboardData();
    if (result.success) {
        renderDashboardPage(result.data);
    } else {
        renderDashboardPage(null);
        const contentDiv = document.getElementById('dashboard-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="text-center text-red-500 mt-4">
                    <h3 class="text-lg font-bold mb-2">データ取得エラー</h3>
                    <p>データの読み込み中にエラーが発生しました。</p>
                    <p class="text-sm mt-2">エラー: ${result.error}</p>
                </div>
            `;
        }
    }
}

// --- Event Listeners ---
appContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.start-quiz-button')) {
        runQuiz(target.dataset.quizId);
    } else if (target.matches('#dashboard-btn-home') || target.matches('#dashboard-btn-result')) {
        showDashboard();
    } else if (target.matches('#gohome-btn-result') || target.matches('#gohome-btn-dash')) {
        goHome();
    }
});

nameInput.addEventListener('input', checkNameAndEnableButtons);

// --- App Initialization ---
initializeSupabase();
renderHomePage();
showPage('home-page');
