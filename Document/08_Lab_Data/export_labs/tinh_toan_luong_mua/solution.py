import sys
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
