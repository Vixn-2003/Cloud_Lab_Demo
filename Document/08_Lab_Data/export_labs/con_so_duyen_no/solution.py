import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    for i in range(1, num_tests + 1):
        s = input_data[i].strip()
        if len(s) > 0 and s[0] == s[-1]:
            print("YES")
        else:
            print("NO")
if __name__ == '__main__':
    solve()
