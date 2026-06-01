const http = require('http');

console.log("========================================================================");
console.log("🛡️ STARTING INTEGRATION TEST FOR 7 NEW PROGRAMMING LABS...");
console.log("========================================================================\n");

const labsToTest = [
  {
    id: "max_triple",
    title: "MAX TRIPLE",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "xoay_mang",
    title: "XOAY MẢNG",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "con_so_duyen_no",
    title: "CON SỐ DUYÊN NỢ",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "lai_suat_ngan_hang",
    title: "LÃI SUẤT NGÂN HÀNG",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "day_so_hamming",
    title: "DÃY SỐ HAMMING",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "liet_ke_cap_so_nguyen_to_cung_nhau",
    title: "LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU",
    profileId: "python_basic",
    code: `import sys
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
`
  },
  {
    id: "tinh_toan_luong_mua",
    title: "TÍNH TOÁN LƯỢNG MƯA",
    profileId: "python_basic",
    code: `import sys
def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n_records = int(lines[0].strip())
    idx = 1
    
    stations = []
    station_indices = {}
    station_rain = {}
    station_time = {}
    
    for _ in range(n_records):
        if idx >= len(lines):
            break
        name = lines[idx].strip()
        start_t = lines[idx+1].strip()
        end_t = lines[idx+2].strip()
        rain_val = float(lines[idx+3].strip())
        idx += 4
        
        sh, sm = map(int, start_t.split(':'))
        eh, em = map(int, end_t.split(':'))
        duration = (eh * 60 + em) - (sh * 60 + sm)
        duration_hours = duration / 60.0
        
        if name not in station_indices:
            station_indices[name] = len(stations)
            stations.append(name)
            station_rain[name] = 0.0
            station_time[name] = 0.0
            
        station_rain[name] += rain_val
        station_time[name] += duration_hours
        
    for i, name in enumerate(stations):
        code = f"T{i+1:02d}"
        avg_rain = station_rain[name] / station_time[name]
        print(f"{code} {name} {avg_rain:.2f}")
        
if __name__ == '__main__':
    solve()
`
  }
];

const results = [];

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function pollSubmissionStatus(executionId, maxRetries = 50) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(async () => {
      try {
        const sub = await getJSON(`/submissions/${executionId}`);
        if (sub && (sub.status === "finished" || sub.status === "failed")) {
          clearInterval(interval);
          resolve(sub);
        }
      } catch (e) {
        // Keep polling
      }
      
      retries++;
      if (retries >= maxRetries) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for grading."));
      }
    }, 200);
  });
}

async function runTests() {
  for (const lab of labsToTest) {
    console.log(`[TESTING] Submitting solution for: ${lab.title}...`);
    try {
      const submitRes = await postJSON('/submit', {
        code: lab.code,
        profileId: lab.profileId,
        labId: lab.id
      });
      const { executionId } = submitRes;

      const subResult = await pollSubmissionStatus(executionId);
      const score = subResult.score !== undefined ? subResult.score : (subResult.result && subResult.result.score) || 0;
      
      results.push({
        id: lab.id,
        title: lab.title,
        score: score,
        status: score === 100 ? "PASS ✅" : "FAIL ❌",
        details: score === 100 ? "All testcases passed" : "Failed some testcases"
      });
      console.log(`[RESULT] ${lab.title}: ${score}% - ${score === 100 ? 'SUCCESS' : 'FAILURE'}`);

    } catch (err) {
      results.push({
        id: lab.id,
        title: lab.title,
        score: 0,
        status: "ERROR 💥",
        details: err.message
      });
      console.error(`[ERROR] Failed to run test for ${lab.title}: ${err.message}`);
    }
    console.log("------------------------------------------------------------------------");
  }

  // Summary Report
  console.log("\n========================================================================");
  console.log("📊             7 NEW PROGRAMMING LABS INTEGRATION REPORT");
  console.log("========================================================================");
  console.log("Bài Thực Hành                            | Điểm số  | Trạng thái");
  console.log("------------------------------------------------------------------------");
  
  let allPassed = true;
  results.forEach(r => {
    console.log(
      r.title.padEnd(40) + " | " + 
      (r.score + "%").padEnd(8) + " | " + 
      r.status
    );
    if (!r.status.includes("PASS")) allPassed = false;
  });
  console.log("========================================================================");

  if (allPassed) {
    console.log("\n🎉 SUCCESS: All 7 new labs successfully passed integration tests with 100/100 points!");
    process.exit(0);
  } else {
    console.error("\n❌ FAILURE: Some integration tests did not pass.");
    process.exit(1);
  }
}

runTests();
