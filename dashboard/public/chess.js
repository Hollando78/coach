class ChessGame {
    constructor() {
        // Game state
        this.board = this.createInitialBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameState = 'menu'; // menu, playing, gameOver
        this.isAIGame = false;
        this.aiDifficulty = 'medium';
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        
        // Castling rights
        this.castlingRights = {
            whiteKingSide: true,
            whiteQueenSide: true,
            blackKingSide: true,
            blackQueenSide: true
        };
        
        // En passant target
        this.enPassantTarget = null;
        
        this.initializeElements();
        this.bindEvents();
        this.showMainMenu();
    }
    
    initializeElements() {
        // Screens
        this.mainMenuEl = document.getElementById('mainMenu');
        this.gameScreenEl = document.getElementById('gameScreen');
        this.gameOverModalEl = document.getElementById('gameOverModal');
        
        // Menu elements
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.playVsAIBtn = document.getElementById('playVsAI');
        this.twoPlayerBtn = document.getElementById('twoPlayer');
        
        // Game elements
        this.chessboardEl = document.getElementById('chessboard');
        this.currentTurnEl = document.getElementById('currentTurn');
        this.gameStatusEl = document.getElementById('gameStatus');
        this.whiteCapturedEl = document.getElementById('whiteCaptured');
        this.blackCapturedEl = document.getElementById('blackCaptured');
        
        // Control buttons
        this.backToMenuBtn = document.getElementById('backToMenu');
        this.newGameBtn = document.getElementById('newGame');
        this.undoMoveBtn = document.getElementById('undoMove');
        
        // Modal elements
        this.gameOverTitleEl = document.getElementById('gameOverTitle');
        this.gameOverMessageEl = document.getElementById('gameOverMessage');
        this.playAgainBtn = document.getElementById('playAgain');
        this.backToMenuFromModalBtn = document.getElementById('backToMenuFromModal');
    }
    
    bindEvents() {
        // Menu events
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aiDifficulty = btn.dataset.difficulty;
            });
        });
        
        this.playVsAIBtn.addEventListener('click', () => this.startNewGame(true));
        this.twoPlayerBtn.addEventListener('click', () => this.startNewGame(false));
        
        // Game control events
        this.backToMenuBtn.addEventListener('click', () => this.showMainMenu());
        this.newGameBtn.addEventListener('click', () => this.startNewGame(this.isAIGame));
        this.undoMoveBtn.addEventListener('click', () => this.undoLastMove());
        
        // Modal events
        this.playAgainBtn.addEventListener('click', () => {
            this.hideGameOverModal();
            this.startNewGame(this.isAIGame);
        });
        this.backToMenuFromModalBtn.addEventListener('click', () => {
            this.hideGameOverModal();
            this.showMainMenu();
        });
        
        // Close modal when clicking outside
        this.gameOverModalEl.addEventListener('click', (e) => {
            if (e.target === this.gameOverModalEl) {
                this.hideGameOverModal();
            }
        });
    }
    
    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Black pieces (top)
        board[0] = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
        board[1] = Array(8).fill('♟');
        
        // White pieces (bottom)
        board[6] = Array(8).fill('♙');
        board[7] = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
        
        return board;
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        this.mainMenuEl.classList.remove('hidden');
        this.gameScreenEl.classList.add('hidden');
    }
    
    startNewGame(vsAI) {
        this.board = this.createInitialBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.isAIGame = vsAI;
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.enPassantTarget = null;
        
        // Reset castling rights
        this.castlingRights = {
            whiteKingSide: true,
            whiteQueenSide: true,
            blackKingSide: true,
            blackQueenSide: true
        };
        
        this.gameState = 'playing';
        this.mainMenuEl.classList.add('hidden');
        this.gameScreenEl.classList.remove('hidden');
        
        this.createChessboard();
        this.updateDisplay();
    }
    
    createChessboard() {
        this.chessboardEl.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceColor = this.getPieceColor(piece);
                    square.innerHTML = `<span class="chess-piece ${pieceColor}-piece">${piece}</span>`;
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.chessboardEl.appendChild(square);
            }
        }
    }
    
    updateDisplay() {
        // Update turn indicator
        this.currentTurnEl.textContent = this.currentTurn.charAt(0).toUpperCase() + this.currentTurn.slice(1);
        
        // Update game status
        if (this.isCheckmate) {
            this.gameStatusEl.textContent = 'Checkmate!';
            this.gameStatusEl.className = 'game-status check';
        } else if (this.isStalemate) {
            this.gameStatusEl.textContent = 'Stalemate!';
            this.gameStatusEl.className = 'game-status';
        } else if (this.isCheck) {
            this.gameStatusEl.textContent = 'Check!';
            this.gameStatusEl.className = 'game-status check';
        } else {
            this.gameStatusEl.textContent = '';
            this.gameStatusEl.className = 'game-status';
        }
        
        // Update captured pieces
        this.updateCapturedPieces();
        
        // Update undo button
        this.undoMoveBtn.disabled = this.moveHistory.length === 0;
    }
    
    updateCapturedPieces() {
        const whiteCapturedHtml = this.capturedPieces.white.map(piece => 
            `<span class="captured-piece">${piece}</span>`
        ).join('');
        
        const blackCapturedHtml = this.capturedPieces.black.map(piece => 
            `<span class="captured-piece">${piece}</span>`
        ).join('');
        
        this.whiteCapturedEl.innerHTML = whiteCapturedHtml;
        this.blackCapturedEl.innerHTML = blackCapturedHtml;
    }
    
    handleSquareClick(row, col) {
        if (this.gameState !== 'playing' || this.isCheckmate || this.isStalemate) {
            return;
        }
        
        // If it's AI's turn in AI game, don't allow moves
        if (this.isAIGame && this.currentTurn === 'black') {
            return;
        }
        
        const piece = this.board[row][col];
        const isCurrentPlayerPiece = piece && this.getPieceColor(piece) === this.currentTurn;
        
        if (this.selectedSquare) {
            const [selectedRow, selectedCol] = this.selectedSquare;
            
            // If clicking the same square, deselect
            if (selectedRow === row && selectedCol === col) {
                this.clearSelection();
                return;
            }
            
            // If clicking on a valid move
            if (this.possibleMoves.some(move => move.row === row && move.col === col)) {
                this.executeMove(selectedRow, selectedCol, row, col);
                return;
            }
            
            // If clicking on own piece, select it instead
            if (isCurrentPlayerPiece) {
                this.selectSquare(row, col);
                return;
            }
            
            // Otherwise, clear selection
            this.clearSelection();
        } else if (isCurrentPlayerPiece) {
            // Select the piece
            this.selectSquare(row, col);
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = [row, col];
        this.possibleMoves = this.getPossibleMoves(row, col);
        this.updateBoardDisplay();
    }
    
    clearSelection() {
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.updateBoardDisplay();
    }
    
    updateBoardDisplay() {
        // Clear all special classes
        document.querySelectorAll('.chess-square').forEach(square => {
            square.classList.remove('selected', 'possible-move', 'possible-capture', 'last-move');
        });
        
        // Highlight selected square
        if (this.selectedSquare) {
            const [row, col] = this.selectedSquare;
            const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            square.classList.add('selected');
        }
        
        // Highlight possible moves
        this.possibleMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (this.board[move.row][move.col]) {
                square.classList.add('possible-capture');
            } else {
                square.classList.add('possible-move');
            }
        });
        
        // Highlight last move
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            const fromSquare = document.querySelector(`[data-row="${lastMove.fromRow}"][data-col="${lastMove.fromCol}"]`);
            const toSquare = document.querySelector(`[data-row="${lastMove.toRow}"][data-col="${lastMove.toCol}"]`);
            fromSquare.classList.add('last-move');
            toSquare.classList.add('last-move');
        }
    }
    
    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Store move in history
        const move = {
            fromRow, fromCol, toRow, toCol,
            piece, capturedPiece,
            castlingRights: { ...this.castlingRights },
            enPassantTarget: this.enPassantTarget
        };
        
        // Execute the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Handle special moves
        this.handleSpecialMoves(piece, fromRow, fromCol, toRow, toCol, move);
        
        // Update captured pieces
        if (capturedPiece) {
            const capturedColor = this.getPieceColor(capturedPiece);
            this.capturedPieces[this.currentTurn].push(capturedPiece);
        }
        
        // Add move to history
        this.moveHistory.push(move);
        
        // Switch turns
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        // Clear selection
        this.clearSelection();
        
        // Update board display
        this.createChessboard();
        
        // Check game state
        this.checkGameState();
        
        // Update display
        this.updateDisplay();
        
        // Make AI move if it's AI game and AI's turn
        if (this.isAIGame && this.currentTurn === 'black' && !this.isCheckmate && !this.isStalemate) {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }
    
    handleSpecialMoves(piece, fromRow, fromCol, toRow, toCol, move) {
        // Handle castling
        if (piece === '♔' || piece === '♚') {
            if (Math.abs(fromCol - toCol) === 2) {
                move.isCastling = true;
                // Move the rook
                if (toCol > fromCol) {
                    // King side castling
                    this.board[fromRow][5] = this.board[fromRow][7];
                    this.board[fromRow][7] = null;
                } else {
                    // Queen side castling
                    this.board[fromRow][3] = this.board[fromRow][0];
                    this.board[fromRow][0] = null;
                }
            }
        }
        
        // Handle en passant
        if ((piece === '♙' || piece === '♟') && this.enPassantTarget && 
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            move.isEnPassant = true;
            const captureRow = piece === '♙' ? toRow + 1 : toRow - 1;
            const capturedPawn = this.board[captureRow][toCol];
            this.board[captureRow][toCol] = null;
            if (capturedPawn) {
                this.capturedPieces[this.currentTurn].push(capturedPawn);
            }
        }
        
        // Handle pawn promotion (auto-promote to queen for now)
        if ((piece === '♙' && toRow === 0) || (piece === '♟' && toRow === 7)) {
            move.isPromotion = true;
            this.board[toRow][toCol] = piece === '♙' ? '♕' : '♛';
        }
        
        // Update en passant target
        if ((piece === '♙' || piece === '♟') && Math.abs(fromRow - toRow) === 2) {
            this.enPassantTarget = {
                row: piece === '♙' ? fromRow - 1 : fromRow + 1,
                col: fromCol
            };
        } else {
            this.enPassantTarget = null;
        }
        
        // Update castling rights
        this.updateCastlingRights(piece, fromRow, fromCol);
    }
    
    updateCastlingRights(piece, fromRow, fromCol) {
        // King moves
        if (piece === '♔') {
            this.castlingRights.whiteKingSide = false;
            this.castlingRights.whiteQueenSide = false;
        } else if (piece === '♚') {
            this.castlingRights.blackKingSide = false;
            this.castlingRights.blackQueenSide = false;
        }
        
        // Rook moves
        if (piece === '♖') {
            if (fromRow === 7 && fromCol === 0) {
                this.castlingRights.whiteQueenSide = false;
            } else if (fromRow === 7 && fromCol === 7) {
                this.castlingRights.whiteKingSide = false;
            }
        } else if (piece === '♜') {
            if (fromRow === 0 && fromCol === 0) {
                this.castlingRights.blackQueenSide = false;
            } else if (fromRow === 0 && fromCol === 7) {
                this.castlingRights.blackKingSide = false;
            }
        }
    }
    
    getPieceColor(piece) {
        const whitePieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
        return whitePieces.includes(piece) ? 'white' : 'black';
    }
    
    getPieceType(piece) {
        const pieceMap = {
            '♔': 'king', '♚': 'king',
            '♕': 'queen', '♛': 'queen',
            '♖': 'rook', '♜': 'rook',
            '♗': 'bishop', '♝': 'bishop',
            '♘': 'knight', '♞': 'knight',
            '♙': 'pawn', '♟': 'pawn'
        };
        return pieceMap[piece];
    }
    
    getPossibleMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const pieceType = this.getPieceType(piece);
        const moves = [];
        
        switch (pieceType) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece));
                break;
        }
        
        // Filter out moves that would put own king in check
        return moves.filter(move => !this.wouldMoveExposeKing(row, col, move.row, move.col));
    }
    
    getPawnMoves(row, col, piece) {
        const moves = [];
        const isWhite = this.getPieceColor(piece) === 'white';
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        // Forward move
        if (this.isValidPosition(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Double forward from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Captures
        for (const captureCol of [col - 1, col + 1]) {
            if (this.isValidPosition(row + direction, captureCol)) {
                const target = this.board[row + direction][captureCol];
                if (target && this.getPieceColor(target) !== this.getPieceColor(piece)) {
                    moves.push({ row: row + direction, col: captureCol });
                }
                
                // En passant
                if (this.enPassantTarget && 
                    this.enPassantTarget.row === row + direction && 
                    this.enPassantTarget.col === captureCol) {
                    moves.push({ row: row + direction, col: captureCol });
                }
            }
        }
        
        return moves;
    }
    
    getRookMoves(row, col, piece) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;
                
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (this.getPieceColor(target) !== this.getPieceColor(piece)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    getKnightMoves(row, col, piece) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || this.getPieceColor(target) !== this.getPieceColor(piece)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    getBishopMoves(row, col, piece) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;
                
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (this.getPieceColor(target) !== this.getPieceColor(piece)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    getQueenMoves(row, col, piece) {
        return [
            ...this.getRookMoves(row, col, piece),
            ...this.getBishopMoves(row, col, piece)
        ];
    }
    
    getKingMoves(row, col, piece) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || this.getPieceColor(target) !== this.getPieceColor(piece)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        // Castling
        const color = this.getPieceColor(piece);
        if (color === 'white' && row === 7 && col === 4) {
            // White castling
            if (this.castlingRights.whiteKingSide && 
                !this.board[7][5] && !this.board[7][6] && this.board[7][7] === '♖') {
                moves.push({ row: 7, col: 6 });
            }
            if (this.castlingRights.whiteQueenSide && 
                !this.board[7][3] && !this.board[7][2] && !this.board[7][1] && this.board[7][0] === '♖') {
                moves.push({ row: 7, col: 2 });
            }
        } else if (color === 'black' && row === 0 && col === 4) {
            // Black castling
            if (this.castlingRights.blackKingSide && 
                !this.board[0][5] && !this.board[0][6] && this.board[0][7] === '♜') {
                moves.push({ row: 0, col: 6 });
            }
            if (this.castlingRights.blackQueenSide && 
                !this.board[0][3] && !this.board[0][2] && !this.board[0][1] && this.board[0][0] === '♜') {
                moves.push({ row: 0, col: 2 });
            }
        }
        
        return moves;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    wouldMoveExposeKing(fromRow, fromCol, toRow, toCol) {
        // Make a temporary move
        const originalPiece = this.board[toRow][toCol];
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        
        const isExposed = this.isKingInCheck(this.currentTurn);
        
        // Restore the board
        this.board[fromRow][fromCol] = this.board[toRow][toCol];
        this.board[toRow][toCol] = originalPiece;
        
        return isExposed;
    }
    
    isKingInCheck(color) {
        // Find the king
        let kingRow, kingCol;
        const kingPiece = color === 'white' ? '♔' : '♚';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === kingPiece) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }
        
        // Check if any opponent piece can attack the king
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === opponentColor) {
                    const moves = this.getPossibleMovesWithoutCheckValidation(row, col);
                    if (moves.some(move => move.row === kingRow && move.col === kingCol)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getPossibleMovesWithoutCheckValidation(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const pieceType = this.getPieceType(piece);
        
        switch (pieceType) {
            case 'pawn': return this.getPawnMoves(row, col, piece);
            case 'rook': return this.getRookMoves(row, col, piece);
            case 'knight': return this.getKnightMoves(row, col, piece);
            case 'bishop': return this.getBishopMoves(row, col, piece);
            case 'queen': return this.getQueenMoves(row, col, piece);
            case 'king': return this.getKingMoves(row, col, piece);
            default: return [];
        }
    }
    
    checkGameState() {
        this.isCheck = this.isKingInCheck(this.currentTurn);
        
        // Check if current player has any legal moves
        let hasLegalMoves = false;
        
        outerLoop: for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === this.currentTurn) {
                    const moves = this.getPossibleMoves(row, col);
                    if (moves.length > 0) {
                        hasLegalMoves = true;
                        break outerLoop;
                    }
                }
            }
        }
        
        if (!hasLegalMoves) {
            if (this.isCheck) {
                this.isCheckmate = true;
                this.gameState = 'gameOver';
                this.showGameOverModal('Checkmate!', `${this.currentTurn === 'white' ? 'Black' : 'White'} wins!`);
            } else {
                this.isStalemate = true;
                this.gameState = 'gameOver';
                this.showGameOverModal('Stalemate!', "It's a draw!");
            }
        }
    }
    
    // AI Chess Engine Implementation
    
    // Piece values for evaluation
    getPieceValue(piece) {
        const values = {
            '♙': 100, '♟': -100,  // Pawns
            '♘': 320, '♞': -320,  // Knights
            '♗': 330, '♝': -330,  // Bishops
            '♖': 500, '♜': -500,  // Rooks
            '♕': 900, '♛': -900,  // Queens
            '♔': 20000, '♚': -20000  // Kings
        };
        return values[piece] || 0;
    }
    
    // Position bonus tables (piece-square tables)
    getPositionBonus(piece, row, col) {
        const pieceType = this.getPieceType(piece);
        const isWhite = this.getPieceColor(piece) === 'white';
        
        // Flip row for black pieces
        const evalRow = isWhite ? row : 7 - row;
        
        const pawnTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];
        
        const knightTable = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];
        
        const bishopTable = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];
        
        const rookTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ];
        
        const queenTable = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ];
        
        const kingMiddleTable = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ];
        
        let bonus = 0;
        switch(pieceType) {
            case 'pawn': bonus = pawnTable[evalRow][col]; break;
            case 'knight': bonus = knightTable[evalRow][col]; break;
            case 'bishop': bonus = bishopTable[evalRow][col]; break;
            case 'rook': bonus = rookTable[evalRow][col]; break;
            case 'queen': bonus = queenTable[evalRow][col]; break;
            case 'king': bonus = kingMiddleTable[evalRow][col]; break;
        }
        
        return isWhite ? bonus : -bonus;
    }
    
    // Evaluate board position
    evaluateBoard() {
        let evaluation = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    evaluation += this.getPieceValue(piece);
                    evaluation += this.getPositionBonus(piece, row, col);
                }
            }
        }
        
        // Add bonuses for game state
        if (this.isCheckmate) {
            evaluation += this.currentTurn === 'white' ? -100000 : 100000;
        } else if (this.isCheck) {
            evaluation += this.currentTurn === 'white' ? -50 : 50;
        }
        
        return evaluation;
    }
    
    // Get all possible moves for a color
    getAllMovesForColor(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === color) {
                    const pieceMoves = this.getPossibleMoves(row, col);
                    for (const move of pieceMoves) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            capturedPiece: this.board[move.row][move.col]
                        });
                    }
                }
            }
        }
        return moves;
    }
    
    // Make a temporary move for evaluation
    makeTempMove(move) {
        const backup = {
            board: this.board.map(row => [...row]),
            currentTurn: this.currentTurn,
            castlingRights: {...this.castlingRights},
            enPassantTarget: this.enPassantTarget,
            isCheck: this.isCheck,
            isCheckmate: this.isCheckmate,
            isStalemate: this.isStalemate
        };
        
        // Make the move
        this.board[move.toRow][move.toCol] = move.piece;
        this.board[move.fromRow][move.fromCol] = null;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        return backup;
    }
    
    // Undo temporary move
    undoTempMove(backup) {
        this.board = backup.board;
        this.currentTurn = backup.currentTurn;
        this.castlingRights = backup.castlingRights;
        this.enPassantTarget = backup.enPassantTarget;
        this.isCheck = backup.isCheck;
        this.isCheckmate = backup.isCheckmate;
        this.isStalemate = backup.isStalemate;
    }
    
    // Minimax with alpha-beta pruning
    minimax(depth, alpha, beta, isMaximizingPlayer) {
        if (depth === 0) {
            return this.evaluateBoard();
        }
        
        const moves = this.getAllMovesForColor(isMaximizingPlayer ? 'white' : 'black');
        
        if (moves.length === 0) {
            if (this.isInCheck(isMaximizingPlayer ? 'white' : 'black')) {
                return isMaximizingPlayer ? -100000 : 100000; // Checkmate
            }
            return 0; // Stalemate
        }
        
        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const backup = this.makeTempMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, false);
                this.undoTempMove(backup);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const backup = this.makeTempMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, true);
                this.undoTempMove(backup);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minEval;
        }
    }
    
    // Find best move using minimax
    findBestMove() {
        const moves = this.getAllMovesForColor('black');
        if (moves.length === 0) return null;
        
        // Determine search depth based on difficulty
        let depth;
        switch(this.aiDifficulty) {
            case 'easy':
                depth = 2;
                break;
            case 'medium':
                depth = 3;
                break;
            case 'hard':
                depth = 4;
                break;
            default:
                depth = 3;
        }
        
        let bestMove = null;
        let bestValue = Infinity;
        
        // Shuffle moves for variety at same evaluation
        const shuffledMoves = moves.sort(() => Math.random() - 0.5);
        
        for (const move of shuffledMoves) {
            const backup = this.makeTempMove(move);
            const value = this.minimax(depth - 1, -Infinity, Infinity, true);
            this.undoTempMove(backup);
            
            // For easy mode, occasionally make suboptimal moves
            let adjustedValue = value;
            if (this.aiDifficulty === 'easy' && Math.random() < 0.3) {
                adjustedValue += Math.random() * 200 - 100; // Add randomness
            }
            
            if (adjustedValue < bestValue) {
                bestValue = adjustedValue;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    makeAIMove() {
        if (this.gameState !== 'playing' || this.currentTurn !== 'black') return;
        
        // Use the new AI to find the best move
        const bestMove = this.findBestMove();
        
        if (bestMove) {
            // Add a small delay for better UX
            setTimeout(() => {
                this.executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            }, 500);
        }
    }
    
    undoLastMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore the board position
        this.board[lastMove.fromRow][lastMove.fromCol] = lastMove.piece;
        this.board[lastMove.toRow][lastMove.toCol] = lastMove.capturedPiece;
        
        // Handle special move undos
        if (lastMove.isCastling) {
            const row = lastMove.fromRow;
            if (lastMove.toCol > lastMove.fromCol) {
                // Undo king side castling
                this.board[row][7] = this.board[row][5];
                this.board[row][5] = null;
            } else {
                // Undo queen side castling
                this.board[row][0] = this.board[row][3];
                this.board[row][3] = null;
            }
        }
        
        if (lastMove.isEnPassant) {
            const captureRow = this.getPieceColor(lastMove.piece) === 'white' ? lastMove.toRow + 1 : lastMove.toRow - 1;
            this.board[captureRow][lastMove.toCol] = this.currentTurn === 'white' ? '♟' : '♙';
        }
        
        // Restore captured pieces
        if (lastMove.capturedPiece) {
            this.capturedPieces[this.currentTurn === 'white' ? 'black' : 'white'].pop();
        }
        
        // Restore game state
        this.castlingRights = lastMove.castlingRights;
        this.enPassantTarget = lastMove.enPassantTarget;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.gameState = 'playing';
        
        // If it was an AI game and we're undoing AI's move, undo player's move too
        if (this.isAIGame && this.currentTurn === 'white' && this.moveHistory.length > 0) {
            this.undoLastMove();
        }
        
        this.clearSelection();
        this.createChessboard();
        this.checkGameState();
        this.updateDisplay();
    }
    
    showGameOverModal(title, message) {
        this.gameOverTitleEl.textContent = title;
        this.gameOverMessageEl.textContent = message;
        this.gameOverModalEl.classList.remove('hidden');
    }
    
    hideGameOverModal() {
        this.gameOverModalEl.classList.add('hidden');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});