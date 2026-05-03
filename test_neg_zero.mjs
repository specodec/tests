#!/usr/bin/env node
// Test -0 handling across languages by running in containers

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const results = {};

// ═══════════════════════════════════════════
// TypeScript (host)
// ═══════════════════════════════════════════
console.log("\n=== TypeScript ===");
try {
  const tsCode = `
import { JsonWriter, GronWriter } from '@specodec/specodec-ts';

// Test f32 -0
const w1 = new JsonWriter();
w1.writeFloat32(-0);
console.log('f32 -0 JSON:', new TextDecoder().decode(w1.toBytes()));

// Test f32 0
const w2 = new JsonWriter();
w2.writeFloat32(0);
console.log('f32 0 JSON:', new TextDecoder().decode(w2.toBytes()));

// Test f64 -0
const w3 = new JsonWriter();
w3.writeFloat64(-0);
console.log('f64 -0 JSON:', new TextDecoder().decode(w3.toBytes()));

// Test f64 0
const w4 = new JsonWriter();
w4.writeFloat64(0);
console.log('f64 0 JSON:', new TextDecoder().decode(w4.toBytes()));

// Test Float32Array truncation
const f32 = new Float32Array(1);
f32[0] = -0;
const v = f32[0];
console.log('Float32Array[-0]:', v, 'Object.is(v, -0):', Object.is(v, -0));
console.log('(-0).toFixed(9):', (-0).toFixed(9));
console.log('(0).toFixed(9):', (0).toFixed(9));
`;
  fs.writeFileSync("/tmp/test_ts.mjs", tsCode);
  const output = execSync(
    `cd ${process.cwd()} && node --experimental-vm-modules /tmp/test_ts.mjs`,
    { encoding: "utf-8" }
  );
  console.log(output);
  results.ts = output;
} catch (e) {
  console.error("TS error:", e.message);
}

// ═══════════════════════════════════════════
// Python
// ═══════════════════════════════════════════
console.log("\n=== Python ===");
const pyCode = `
import struct

# f32 -0
v_f32_neg = struct.unpack('f', struct.pack('f', -0.0))[0]
print(f'f32 -0: {v_f32_neg:.9f}')
print(f'f32 -0 sign: {"negative" if struct.pack("f", v_f32_neg)[0] & 0x80 else "positive"}')

# f32 0
v_f32_0 = struct.unpack('f', struct.pack('f', 0.0))[0]
print(f'f32 0: {v_f32_0:.9f}')

# f64 -0
v_f64_neg = -0.0
print(f'f64 -0: {v_f64_neg:.17f}')
print(f'f64 -0 sign: {"negative" if struct.pack("d", v_f64_neg)[0] & 0x80 else "positive"}')

# f64 0
v_f64_0 = 0.0
print(f'f64 0: {v_f64_0:.17f}')

# Raw float parsing
print(f'float("-0"): {float("-0"):.17f}')
print(f'float("-0.0"): {float("-0.0"):.17f}')
`;
try {
  const output = execSync(`python3 -c '${pyCode}'`, { encoding: "utf-8" });
  console.log(output);
  results.py = output;
} catch (e) {
  console.error("Python error:", e.message);
}

// ═══════════════════════════════════════════
// Go
// ═══════════════════════════════════════════
console.log("\n=== Go ===");
const goCode = `
package main

import (
	"fmt"
	"math"
)

func main() {
	// f32 -0
	var f32_neg float32 = -0.0
	fmt.Printf("f32 -0: %.9f\\n", f32_neg)
	fmt.Printf("f32 -0 signbit: %v\\n", math.Signbit(float64(f32_neg)))
	
	// f32 0
	var f32_0 float32 = 0.0
	fmt.Printf("f32 0: %.9f\\n", f32_0)
	fmt.Printf("f32 0 signbit: %v\\n", math.Signbit(float64(f32_0)))
	
	// f64 -0
	var f64_neg float64 = -0.0
	fmt.Printf("f64 -0: %.17f\\n", f64_neg)
	fmt.Printf("f64 -0 signbit: %v\\n", math.Signbit(f64_neg))
	
	// f64 0
	var f64_0 float64 = 0.0
	fmt.Printf("f64 0: %.17f\\n", f64_0)
	fmt.Printf("f64 0 signbit: %v\\n", math.Signbit(f64_0))
}
`;
try {
  fs.writeFileSync("/tmp/test_go.go", goCode);
  execSync(`go build -o /tmp/test_go /tmp/test_go.go`, { encoding: "utf-8" });
  const output = execSync(`/tmp/test_go`, { encoding: "utf-8" });
  console.log(output);
  results.go = output;
} catch (e) {
  console.error("Go error:", e.message);
}

// ═══════════════════════════════════════════
// Rust
// ═══════════════════════════════════════════
console.log("\n=== Rust ===");
const rustCode = `
fn main() {
    // f32 -0
    let f32_neg: f32 = -0.0;
    println!("f32 -0: {:.9}", f32_neg);
    println!("f32 -0 is_negative: {}", f32_neg.is_sign_negative());
    
    // f32 0
    let f32_0: f32 = 0.0;
    println!("f32 0: {:.9}", f32_0);
    println!("f32 0 is_negative: {}", f32_0.is_sign_negative());
    
    // f64 -0
    let f64_neg: f64 = -0.0;
    println!("f64 -0: {:.17}", f64_neg);
    println!("f64 -0 is_negative: {}", f64_neg.is_sign_negative());
    
    // f64 0
    let f64_0: f64 = 0.0;
    println!("f64 0: {:.17}", f64_0);
    println!("f64 0 is_negative: {}", f64_0.is_sign_negative());
}
`;
try {
  fs.writeFileSync("/tmp/test_rust.rs", rustCode);
  execSync(`rustc --edition 2021 -o /tmp/test_rust /tmp/test_rust.rs`, { encoding: "utf-8" });
  const output = execSync(`/tmp/test_rust`, { encoding: "utf-8" });
  console.log(output);
  results.rust = output;
} catch (e) {
  console.error("Rust error:", e.message);
}

// ═══════════════════════════════════════════
// Kotlin (via container)
// ═══════════════════════════════════════════
console.log("\n=== Kotlin ===");
const kotlinCode = `
fun main() {
    // f32 -0
    val f32_neg: Float = -0.0f
    println("f32 -0: %.9f".format(f32_neg))
    println("f32 -0 bits: ${f32_neg.toBits()}")
    println("f32 -0 rawBits: ${f32_neg.toRawBits()}")
    
    // f32 0
    val f32_0: Float = 0.0f
    println("f32 0: %.9f".format(f32_0))
    println("f32 0 rawBits: ${f32_0.toRawBits()}")
    
    // f64 -0
    val f64_neg: Double = -0.0
    println("f64 -0: %.17f".format(f64_neg))
    println("f64 -0 rawBits: ${f64_neg.toRawBits()}")
    
    // f64 0
    val f64_0: Double = 0.0
    println("f64 0: %.17f".format(f64_0))
    println("f64 0 rawBits: ${f64_0.toRawBits()}")
}
`;
try {
  fs.writeFileSync("/tmp/test_kotlin.kt", kotlinCode);
  const output = execSync(
    `podman run --rm -v /tmp:/tmp localhost/specodec-interop-kotlin:latest kotlinc /tmp/test_kotlin.kt -include-runtime -d /tmp && java -jar /tmp/TestKotlin.jar`,
    { encoding: "utf-8", timeout: 30000 }
  );
  console.log(output);
  results.kotlin = output;
} catch (e) {
  console.error("Kotlin error:", e.message);
  // Try simpler approach
  try {
    const dockerfile = `
FROM kotlin:latest
COPY test_kotlin.kt /tmp/
RUN kotlinc /tmp/test_kotlin.kt -include-runtime -d /tmp/test_kotlin.jar
CMD ["java", "-jar", "/tmp/test_kotlin.jar"]
`;
    fs.writeFileSync("/tmp/Containerfile.kotlin_test", dockerfile);
    fs.writeFileSync("/tmp/test_kotlin.kt", kotlinCode);
    execSync(`podman build -t kotlin-test -f /tmp/Containerfile.kotlin_test /tmp`, { encoding: "utf-8" });
    const output = execSync(`podman run --rm kotlin-test`, { encoding: "utf-8" });
    console.log(output);
    results.kotlin = output;
  } catch (e2) {
    console.error("Kotlin fallback error:", e2.message);
  }
}

// ═══════════════════════════════════════════
// Dart (via container)
// ═══════════════════════════════════════════
console.log("\n=== Dart ===");
const dartCode = `
import 'dart:typed_data';

void main() {
  // f32 -0
  var f32List = Float32List(1);
  f32List[0] = -0.0;
  var f32_neg = f32List[0];
  print('f32 -0: ${f32_neg.toStringAsFixed(9)}');
  print('f32 -0 isNegative: ${f32_neg.isNegative}');
  
  // f32 0
  f32List[0] = 0.0;
  var f32_0 = f32List[0];
  print('f32 0: ${f32_0.toStringAsFixed(9)}');
  print('f32 0 isNegative: ${f32_0.isNegative}');
  
  // f64 -0
  var f64_neg = -0.0;
  print('f64 -0: ${f64_neg.toStringAsFixed(17)}');
  print('f64 -0 isNegative: ${f64_neg.isNegative}');
  
  // f64 0
  var f64_0 = 0.0;
  print('f64 0: ${f64_0.toStringAsFixed(17)}');
  print('f64 0 isNegative: ${f64_0.isNegative}');
}
`;
try {
  fs.writeFileSync("/tmp/test_dart.dart", dartCode);
  const output = execSync(
    `podman run --rm -v /tmp:/tmp localhost/specodec-interop-dart:latest dart run /tmp/test_dart.dart`,
    { encoding: "utf-8", timeout: 30000 }
  );
  console.log(output);
  results.dart = output;
} catch (e) {
  console.error("Dart error:", e.message);
}

// ═══════════════════════════════════════════
// Swift (via container)
// ═══════════════════════════════════════════
console.log("\n=== Swift ===");
const swiftCode = `
import Foundation

// f32 -0
let f32_neg: Float32 = -0.0
print("f32 -0: \(String(format: "%.9f", f32_neg))")
print("f32 -0 sign: \(f32_neg.sign)")

// f32 0
let f32_0: Float32 = 0.0
print("f32 0: \(String(format: "%.9f", f32_0))")
print("f32 0 sign: \(f32_0.sign)")

// f64 -0
let f64_neg: Float64 = -0.0
print("f64 -0: \(String(format: "%.17f", f64_neg))")
print("f64 -0 sign: \(f64_neg.sign)")

// f64 0
let f64_0: Float64 = 0.0
print("f64 0: \(String(format: "%.17f", f64_0))")
print("f64 0 sign: \(f64_0.sign)")
`;
try {
  fs.writeFileSync("/tmp/test_swift.swift", swiftCode);
  const output = execSync(
    `podman run --rm -v /tmp:/tmp localhost/specodec-interop-swift:latest swift /tmp/test_swift.swift`,
    { encoding: "utf-8", timeout: 30000 }
  );
  console.log(output);
  results.swift = output;
} catch (e) {
  console.error("Swift error:", e.message);
}

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════
console.log("\n=== SUMMARY ===");
console.log("Expected outputs:");
console.log("  f32 -0: -0.000000000");
console.log("  f64 -0: -0.00000000000000000");
console.log("\nActual outputs per language:");
console.log(results);