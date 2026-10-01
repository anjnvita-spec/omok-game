# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

브라우저에서 바로 실행되는 순수 웹(HTML/CSS/JS) 오목(Gomoku) 게임입니다. 빌드 도구나 백엔드 서버 없이 `index.html`을 여는 것만으로 동작하는 것을 목표로 합니다.

## Game Rules & Modes

- 보드: 15x15 격자
- 승리 조건: 가로/세로/대각선으로 같은 돌 5개를 연속으로 놓으면 승리
- 모드 1 — 사람 대 사람 (Player vs Player): 흑/백이 번갈아 턴을 진행
- 모드 2 — 사람 대 AI (Player vs AI): 대국 시작 전 AI 난이도를 1~5단계 중 선택
  - 숫자가 클수록 AI가 더 잘 둠 (예: 단계가 올라갈수록 탐색 깊이 증가, 무작위성 감소, 공격/방어 평가 가중치 정교화)
  - 난이도 구현 방식(예: minimax + alpha-beta pruning, 평가 함수 가중치 조정, 단계별 탐색 깊이)은 구현 시 이 섹션에 구체적으로 업데이트

## Tech Stack

- HTML / CSS / Vanilla JavaScript (프레임워크 없음)
- 별도 빌드 과정 없이 브라우저에서 직접 실행

## Project Structure (초기 구성 제안)

- `index.html` — 게임 화면 진입점 (모드 선택, 난이도 선택 UI 포함)
- `style.css` — 보드 및 UI 스타일
- `script.js` (또는 `src/` 하위 모듈 분리) — 게임 로직
  - 보드 상태 관리
  - 턴 진행 및 오목(5목) 승리 판정
  - PvP / PvAI 모드 전환
  - AI 로직 (난이도별 탐색/평가 함수)

## Build, Lint, Test Commands

- 별도 빌드 단계 없음 — `index.html`을 브라우저로 열어 실행/확인
- (추후 테스트 프레임워크나 lint 도구를 도입하면 이 섹션에 실제 명령어를 기록)

## Development Notes

- 코드가 추가되면 이 파일의 "Project Structure", "Build/Lint/Test" 섹션을 실제 구조와 명령어로 갱신할 것
- AI 난이도 알고리즘을 구현하면 각 단계(1~5)의 구체적인 동작 방식을 "Game Rules & Modes" 섹션에 기록할 것
