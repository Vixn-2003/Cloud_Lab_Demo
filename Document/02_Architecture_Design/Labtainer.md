# SKILL — Integrating Labtainer into Multi-Environment Coding Lab Platform

## Core Understanding

Labtainer is NOT:
- an online judge
- a Monaco IDE
- a simple code runner
- a Judge0 replacement

Labtainer IS:
- an environment-based cybersecurity lab engine
- a multi-container Linux lab framework
- a cyber range style runtime system
- a topology-driven execution environment

The platform must NEVER treat Labtainer as a simple "execute code" service.

---

# Architectural Principle

The platform has TWO different execution categories:

## 1. Code Execution Labs

Purpose:
- algorithm exercises
- stdin/stdout problems
- programming assignments

Examples:
- Python
- Java
- Node.js
- C++

Execution:
- DockerRunner
- Judge0-like execution
- stateless sandbox

Main interaction:
- Monaco Editor

Grading:
- testcase based
- stdout/stderr
- compile/run pipeline

---

## 2. Environment-Based Labs

Purpose:
- Linux labs
- cybersecurity labs
- network labs
- CLI tool labs
- multi-node scenarios

Examples:
- Nmap
- OpenSSL
- tcpdump
- SSH
- firewall
- DNS
- routing
- exploit demo
- packet analysis

Execution:
- LabtainerRunner

Main interaction:
- SSH terminal
- Web terminal
- Linux shell

Grading:
- behavior/state based
- file existence
- service state
- network state
- command execution
- configuration validation

---

# IMPORTANT

The system MUST NOT:
- force all labs into Monaco
- simulate all labs using Python
- convert system labs into fake algorithm problems

The system MUST:
- preserve the authentic runtime
- preserve the original environment type
- preserve the original toolchain

Example:
- OpenSSL lab must use openssl binary
- Nmap lab must use nmap binary
- tcpdump lab must use tcpdump
- Linux labs must use real shell environments

---

# Production Taxonomy

Environment categories:

## single_runtime
Examples:
- Python
- Java
- Node.js
- C++

Execution:
- isolated runtime container

---

## single_machine
Examples:
- Ubuntu CLI
- OpenSSL labs
- Nmap labs
- bash scripting

Execution:
- Linux environment
- SSH terminal
- tool-based environment

---

## multi_node
Examples:
- attacker/victim
- DNS simulation
- routing labs
- network segmentation
- packet forwarding

Execution:
- multiple containers
- virtual topology
- isolated networks

---

# Correct Design Flow

The AI MUST follow this order:

## Step 1 — Determine original lab type

Possible types:
- algorithm lab
- CLI tool lab
- Linux lab
- compiled language lab
- database lab
- web lab
- multi-node security lab

---

## Step 2 — Determine original environment

Examples:
- Ubuntu CLI
- Java runtime
- Node runtime
- Postgres
- Browser iframe
- Multi-node network

---

## Step 3 — Choose execution engine FIRST

IF:
- stdin/stdout coding problem
THEN:
- DockerRunner

IF:
- Linux/security/network environment
THEN:
- LabtainerRunner

---

## Step 4 — Simplify the lab ONLY AFTER runtime selection

Allowed simplifications:
- reduce topology
- reduce data
- reduce steps
- reduce grading complexity

NOT allowed:
- changing Linux lab into Python simulation
- replacing CLI tools with fake code
- removing authentic environment behavior

---

# LabtainerRunner Role

LabtainerRunner is:
- an execution adapter
- an orchestration bridge
- a runtime backend

It is NOT:
- the LMS
- the frontend
- the IDE
- the grading UI

---

# Correct Architecture

Frontend
- Monaco Editor for code labs
- Web Terminal for Linux/security labs

Backend
- Assignment Service
- Submission Service
- Session Service
- SSH Session Manager
- Artifact Service
- Grading Service

Execution Layer
- DockerRunner
- LabtainerRunner

---

# Correct Runtime Flow

## Code Lab

Student
→ Monaco
→ Run
→ DockerRunner
→ stdout/stderr
→ testcase grading

---

## Environment Lab

Student
→ Web Terminal
→ SSH session
→ Labtainer environment
→ grading scripts
→ state validation

---

# SSH Architecture

SSH is the bridge between:
- platform
- student terminal
- Labtainer environments

Correct flow:

Browser
→ Backend
→ SSH Session
→ Labtainer Container

The system SHOULD use:
- temporary credentials
- isolated sessions
- per-session containers
- session cleanup

---

# Artifact Submission Mode (MVP Mode)

Allowed architecture for early stages:

Student
→ use external Labtainer software
→ complete lab externally
→ export artifacts
→ upload to platform
→ grading service validates artifacts

---

# Artifact Structure

submission.zip
├── manifest.json
├── answer/
├── logs/
├── evidence/
└── checksum.txt

manifest.json example:

{
  "studentId": "SV001",
  "labId": "nmap-lab",
  "assignmentVersion": "1.0.0",
  "tool": "labtainer",
  "startedAt": "...",
  "finishedAt": "...",
  "artifactHash": "..."
}

---

# Grading Philosophy

Environment labs must NOT rely only on stdout matching.

Preferred grading:
- state validation
- filesystem checks
- service checks
- network checks
- configuration checks
- evidence verification

---

# Security Principles

Labtainer environments execute untrusted student behavior.

The system MUST:
- isolate sessions
- destroy environments after completion
- avoid host exposure
- restrict privileged operations
- separate grading infrastructure
- log execution evidence

---

# Common Mistakes

WRONG:
- using Labtainer for all labs
- replacing Monaco entirely
- converting Labtainer into Judge0
- simulating Linux labs using Python

CORRECT:
- use Labtainer ONLY for environment-based labs
- keep separate execution engines
- preserve authentic runtime behavior

---

# Long-Term Evolution

## Phase 1
External Labtainer tool
+ artifact upload

---

## Phase 2
Integrated Web SSH terminal

---

## Phase 3
Backend-controlled Labtainer orchestration

---

# Final Principle

The platform is:
- a university lab platform
- an orchestration and grading system

Labtainer is:
- a specialized runtime engine
- for Linux/security/network environments only