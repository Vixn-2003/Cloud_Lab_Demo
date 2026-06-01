import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = int(input_data[idx])
        idx += 1
        m1, m2, m3 = -99999999999999999, -99999999999999999, -99999999999999999
        for i in range(n):
            val = int(input_data[idx + i])
            if val > m1:
                m3 = m2
                m2 = m1
                m1 = val
            elif val > m2:
                m3 = m2
                m2 = val
            elif val > m3:
                m3 = val
        idx += n
        print(m1 + m2 + m3)
if __name__ == '__main__':
    solve()
