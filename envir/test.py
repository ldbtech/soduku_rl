
import numpy as np
from envir import Sudoku


def test_valid_9x9():
    sudoku = Sudoku(9, 9, 9)

    board = np.array([
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8]
    ])

    assert sudoku.validate_sudoku(board) is True


def test_empty_board():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    assert sudoku.validate_sudoku(board) is True


def test_duplicate_row():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    board[0, 0] = 5
    board[0, 1] = 5

    assert sudoku.validate_sudoku(board) is False


def test_duplicate_column():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    board[0, 0] = 5
    board[1, 0] = 5

    assert sudoku.validate_sudoku(board) is False


def test_duplicate_subgrid():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    board[0, 0] = 5
    board[1, 1] = 5

    assert sudoku.validate_sudoku(board) is False


def test_invalid_symbol():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    board[0, 0] = 10

    assert sudoku.validate_sudoku(board) is False


def test_negative_symbol():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=int)

    board[0, 0] = -1

    assert sudoku.validate_sudoku(board) is False


def test_wrong_dimensions():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((8, 9), dtype=int)

    assert sudoku.validate_sudoku(board) is False


def test_non_integer_board():
    sudoku = Sudoku(9, 9, 9)
    board = np.zeros((9, 9), dtype=float)

    assert sudoku.validate_sudoku(board) is False


def test_rectangular_board():
    sudoku = Sudoku(6, 9, 9)
    board = np.zeros((6, 9), dtype=int)

    assert sudoku.validate_sudoku(board) is True


tests = [
    test_valid_9x9,
    test_empty_board,
    test_duplicate_row,
    test_duplicate_column,
    test_duplicate_subgrid,
    test_invalid_symbol,
    test_negative_symbol,
    test_wrong_dimensions,
    test_non_integer_board,
    test_rectangular_board
]

for test in tests:
    test()
    print(f"PASS: {test.__name__}")

print(f"\n{len(tests)} tests passed.")

