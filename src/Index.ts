import { Game } from './Game';
import './style.css';

export var USE_WAVEDASH_SDK = true;
if (window.location.href.indexOf("localhost") != -1) {
    USE_WAVEDASH_SDK = false;
}
export var Wavedash: any;

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app root element')
}

const canvas = document.createElement('canvas')
canvas.id = 'render-canvas'
app.appendChild(canvas);

const newGame = document.createElement('button');
newGame.id = 'newgame-btn';
newGame.textContent = 'NEW GAME';
app.appendChild(newGame);

const title = document.createElement('div');
title.id = 'title';
title.innerHTML = 'CUBE PETS TOWER';
app.appendChild(title);

const score = document.createElement('div');
score.id = 'score';
score.textContent = '00000';
app.appendChild(score);

const lives = document.createElement('div');
lives.id = 'lives';
lives.innerHTML = `<span>&#x2665;&#xfe0f;</span><span>&#x2665;&#xfe0f;</span><span>&#x2665;&#xfe0f;</span><span>&#x2665;&#xfe0f;</span><span>&#x2665;&#xfe0f;</span><span>&#x2665;&#xfe0f;</span>`;
app.appendChild(lives);

const gameStateContainer = document.createElement('div');
gameStateContainer.id = 'game-state-container';
app.appendChild(gameStateContainer);

const gameState = document.createElement('div');
gameState.id = 'game-state';
gameState.textContent = '';
gameStateContainer.appendChild(gameState);

const gameStateTimer = document.createElement('div');
gameStateTimer.id = 'game-state-timer';
gameStateTimer.textContent = '';
gameStateContainer.appendChild(gameStateTimer);

const nextBtn = document.createElement('button');
nextBtn.id = 'next-btn';
nextBtn.textContent = 'NEXT';
gameStateContainer.appendChild(nextBtn);

const nextBtnLabel = document.createElement('div');
nextBtnLabel.id = 'next-btn-label';
nextBtnLabel.textContent = '- click to start the rain ! -';
nextBtn.appendChild(nextBtnLabel);

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.textContent = 'Hello World !';
app.appendChild(tooltip);

if (USE_WAVEDASH_SDK) {
    Wavedash = await (window as any).Wavedash;
    Wavedash.updateLoadProgressZeroToOne(0.5);
    await Wavedash.init();
}

const game = new Game(canvas);
game.initAndStart();
