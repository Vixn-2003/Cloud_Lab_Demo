import sys
import math
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = float(input_data[idx])
        x = float(input_data[idx+1])
        m = float(input_data[idx+2])
        idx += 3
        ratio = m / n
        rate = 1.0 + x / 100.0
        years = math.ceil(math.log(ratio) / math.log(rate))
        print(years)
if __name__ == '__main__':
    solve()
