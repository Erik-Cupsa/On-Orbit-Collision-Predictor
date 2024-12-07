import matlab.engine
import argparse

def main():
    parser = argparse.ArgumentParser(description="Run MATLAB sqrt function from Python")
    parser.add_argument("number", type=float, help="The number to calculate the square root of")
    args = parser.parse_args()

    eng = matlab.engine.start_matlab()
    result = eng.sqrt(args.number)
    print(result)
    eng.quit()

if __name__ == "__main__":
    main()