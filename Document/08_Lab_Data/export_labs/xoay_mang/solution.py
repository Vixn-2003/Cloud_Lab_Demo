import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = int(input_data[idx])
        d = int(input_data[idx + 1])
        idx += 2
        arr = input_data[idx:idx + n]
        idx += n
        d = d % n
        rotated = arr[d:] + arr[:d]
        print(" ".join(rotated))
if __name__ == '__main__':
    solve()
