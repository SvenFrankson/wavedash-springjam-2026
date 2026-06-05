import { Game } from './Game';
import './style.css';

export var USE_WAVEDASH_SDK = true;
if (window.location.href.indexOf("localhost") != -1 || window.location.href.indexOf(":5173") != -1) {
    USE_WAVEDASH_SDK = false;
}
export var Wavedash: any;

declare function incLoading(progress?: number): void;

if (USE_WAVEDASH_SDK) {
    Wavedash = await (window as any).Wavedash;
}
incLoading();

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app root element')
}

const canvas = document.createElement('canvas')
canvas.id = 'render-canvas'
app.appendChild(canvas);


const homeContainer = document.createElement('div');
homeContainer.id = 'home-container';
app.appendChild(homeContainer);

const title = document.createElement('div');
title.id = 'title';
title.innerHTML = 'CUBE PETS TOWER';
app.appendChild(title);

const newGame = document.createElement('button');
newGame.id = 'newgame-btn';
newGame.textContent = 'NEW GAME';
app.appendChild(newGame);

const credit = document.createElement('div');
credit.id = 'credit';
credit.innerHTML = `
    <span>Game by <a href="https://tiaratum.com" target="_blank"><img src="./icons/tiaratum-logo.png" style="height: 20px; vertical-align: middle;" /></a></span><br/>
    <span style="display: inline-block; width: 250px; text-align: left;">Code, Concept & Design</span> <span style="display: inline-block; width: 120px; text-align: right;">Sven</span><br/><br/>
    
    <span>Assets thanks to</span><br/>
    <span style="display: inline-block; width: 250px; text-align: left;">Cube-Pets Models (CC0)</span> <span style="display: inline-block; width: 120px; text-align: right;">Kenney</span><br/>
    <span style="display: inline-block; width: 250px; text-align: left;">Origami Music (CC-BY)</span> <span style="display: inline-block; width: 120px; text-align: right;">Scott Buckley</span><br/>
    <span style="display: inline-block; width: 250px; text-align: left;">SkyBox In The Cloud (CC-BY)</span> <span style="display: inline-block; width: 120px; text-align: right;">Paul</span>
`;
app.appendChild(credit);

const gameOverContainer = document.createElement('div');
gameOverContainer.id = 'gameover-container';
app.appendChild(gameOverContainer);

const gameOverBtn = document.createElement('button');
gameOverBtn.id = 'gameover-btn';
gameOverBtn.textContent = 'CONTINUE';
gameOverBtn.style.display = 'none';
gameOverContainer.appendChild(gameOverBtn);

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

const game = new Game(canvas);
game.initAndStart();

