import random 
import numpy as np
import json
from rule_engine import RuleEngine
"""
    The goal of this class to have complete sudoku setup with 
    any parameters.
    - Init state with zeros cell
    - Rules
    - fill_empty_cell
    - steps for reinforcement learning to take 
    - reset the board 
    - action what kind of step will the agent takes.
"""

class Sudoku:
    def __init__(
            self, 
            num_cols: int = 9, 
            num_rows: int = 9,
            num_symbols: int = 9):
        self.num_cols = num_cols
        self.num_rows = num_rows
        self.num_symbols = num_symbols 
        self.rule_engine = RuleEngine()

    def init_state(self) -> np.ndarray:
        return np.zeros((self.num_rows, self.num_cols), dtype=int)

    def calculate_subgrid(self) -> tuple[int, int]:
        candidates = []

        for br in range(1, self.num_rows + 1):
            for bc in range(1, self.num_cols + 1):

                if (self.num_rows % br == 0 and self.num_cols % bc == 0 and 
                    br * bc == self.num_cols):
                    candidates.append((br, bc))

        if not candidates:
            raise ValueError("Invalid Sudoku dimentions")

        return min(candidates, key=lambda pair: abs(pair[0] - pair[1]))

    def validate_sudoku(self, board: np.ndarray) -> bool:
        """
            - Validate board dimentions 
            - Subgrid dimentions 
            - Sudoku rules : does this board violate any rows, columns, or subgrid constrains 
            
        """

        return self.rule_engine.validate(
                board,
                (self.num_rows, self.num_cols),
                self.num_symbols,
               self.calculate_subgrid()
       )


    def rules(self):
        pass

    def fill_empty_cell(self):
        pass

    def steps(self):
        pass

    def reset(sel):
        pass

    def action(self):
        pass
