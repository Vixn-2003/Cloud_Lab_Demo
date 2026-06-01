import sys
import bisect
def solve():
    limit = 10**18
    p2 = [2**i for i in range(61)]
    p3 = [3**j for j in range(39)]
    p5 = [5**k for k in range(27)]
    hamming = []
    for x2 in p2:
        for x3 in p3:
            val23 = x2 * x3
            if val23 > limit:
                break
            for x5 in p5:
                val = val23 * x5
                if val > limit:
                    break
                hamming.append(val)
    hamming.sort()
    
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    for i in range(1, num_tests + 1):
        n = int(input_data[i])
        idx = bisect.bisect_left(hamming, n)
        if idx < len(hamming) and hamming[idx] == n:
            print(idx + 1)
        else:
            print("Not in sequence")
if __name__ == '__main__':
    solve()
