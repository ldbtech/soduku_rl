
import json
import numpy as np


class RuleEngine:

    def __init__(self, rules_file="rules.json"):
        with open(rules_file, "r") as file:
            self.rules = json.load(file)["rules"]

        self.rule_handlers = {
            "dimension_check": self._validate_dimensions,
            "value_range": self._validate_values,
            "unique": self._validate_unique
        }

    def validate(self, board, expected_shape, num_symbols, subgrid_shape):

        if not isinstance(board, np.ndarray):
            return False

        if board.ndim != 2:
            return False

        context = {
            "expected_shape": expected_shape,
            "num_symbols": num_symbols,
            "subgrid_shape": subgrid_shape
        }

        for rule in self.rules:

            if not rule["enabled"]:
                continue

            handler = self.rule_handlers.get(rule["type"])

            if handler is None:
                return False

            if not handler(board, rule, context):
                return False

        return True

    def _validate_dimensions(self, board, rule, context):
        return board.shape == context["expected_shape"]

    def _validate_values(self, board, rule, context):
        if not np.issubdtype(board.dtype, np.integer):
            return False

        minimum = rule["min"]
        maximum = context["num_symbols"]

        return np.all(
            (board >= minimum) & (board <= maximum)
        )

    def _validate_unique(self, board, rule, context):

        scope = rule["scope"]
        empty = rule["ignore"]

        if scope == "row":
            groups = board

        elif scope == "column":
            groups = board.T

        elif scope == "subgrid":
            br, bc = context["subgrid_shape"]

            if br <= 0 or bc <= 0:
                return False

            if board.shape[0] % br != 0:
                return False

            if board.shape[1] % bc != 0:
                return False

            groups = (
                board[r:r + br, c:c + bc].flatten()
                for r in range(0, board.shape[0], br)
                for c in range(0, board.shape[1], bc)
            )

        else:
            return False

        for group in groups:
            values = group[group != empty]

            if len(values) != len(set(values)):
                return False

        return True

