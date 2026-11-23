from envir import Sudoku

def main():
    s = Sudoku(6, 6)
    print(s.init_state())
    print("Hello Soduku")
    
    pairs = s.calculate_subgrid()
    print(f"\n Paris: {pairs}")
    
    rule = s.validate_sudoku(s.init_state())

    print(f"rule: {rule}")

if __name__ == "__main__":
    main()
