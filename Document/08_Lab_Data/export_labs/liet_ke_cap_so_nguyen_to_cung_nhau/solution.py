import sys
import math
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    arr.sort()
    for i in range(n):
        for j in range(i + 1, n):
            if math.gcd(arr[i], arr[j]) == 1:
                print(f"{arr[i]} {arr[j]}")
if __name__ == '__main__':
    solve()
