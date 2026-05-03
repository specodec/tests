#!/bin/bash
# Test -0 handling across all languages

set -e
cd "$(dirname "$0")"

echo "=== Testing -0 handling ==="
echo ""

# Create test files
mkdir -p /tmp/negzero_test

# ═══════════════════════════════════════════
# Python test
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_py.py << 'PYEOF'
import struct
import math

# f32 -0
v_f32_neg = struct.unpack('f', struct.pack('f', -0.0))[0]
print(f'f32 -0: {v_f32_neg:.9f}')
b = struct.pack('f', v_f32_neg)
print(f'f32 -0 is_negative: {b[0] & 0x80 != 0}')

# f32 0
v_f32_0 = struct.unpack('f', struct.pack('f', 0.0))[0]
print(f'f32 0: {v_f32_0:.9f}')
b = struct.pack('f', v_f32_0)
print(f'f32 0 is_negative: {b[0] & 0x80 != 0}')

# f64 -0
v_f64_neg = -0.0
print(f'f64 -0: {v_f64_neg:.17f}')
b = struct.pack('d', v_f64_neg)
print(f'f64 -0 is_negative: {b[0] & 0x80 != 0}')

# f64 0
v_f64_0 = 0.0
print(f'f64 0: {v_f64_0:.17f}')
b = struct.pack('d', v_f64_0)
print(f'f64 0 is_negative: {b[0] & 0x80 != 0}')

# Format test
print(f'format f32 -0: {v_f32_neg:.9f}')
print(f'format f64 -0: {v_f64_neg:.17f}')
PYEOF

echo "=== Python ==="
python3 /tmp/negzero_test/test_py.py
echo ""

# ═══════════════════════════════════════════
# TypeScript test (run from interop dir where package is available)
# ═══════════════════════════════════════════
echo "=== TypeScript ==="
cd /home/ytr/Specodec/tests/interop
cat > test_ts_temp.mjs << 'TSEOF'
import { JsonWriter, GronWriter } from '@specodec/specodec-ts';

console.log('=== TS Float32Array ===');
const f32 = new Float32Array(1);

f32[0] = -0;
let v = f32[0];
console.log('Float32Array[-0]:', v);
console.log('Object.is(v, -0):', Object.is(v, -0));
console.log('toFixed(9):', v.toFixed(9));

f32[0] = 0;
v = f32[0];
console.log('Float32Array[0]:', v);
console.log('Object.is(v, -0):', Object.is(v, -0));
console.log('toFixed(9):', v.toFixed(9));

console.log('');
console.log('=== TS Number.toFixed ===');
console.log('(-0).toFixed(9):', (-0).toFixed(9));
console.log('(0).toFixed(9):', (0).toFixed(9));
console.log('(-0).toFixed(17):', (-0).toFixed(17));
console.log('(0).toFixed(17):', (0).toFixed(17));

console.log('');
console.log('=== TS JsonWriter ===');
const w1 = new JsonWriter();
w1.writeFloat32(-0);
console.log('writeFloat32(-0):', new TextDecoder().decode(w1.toBytes()));

const w2 = new JsonWriter();
w2.writeFloat32(0);
console.log('writeFloat32(0):', new TextDecoder().decode(w2.toBytes()));

const w3 = new JsonWriter();
w3.writeFloat64(-0);
console.log('writeFloat64(-0):', new TextDecoder().decode(w3.toBytes()));

const w4 = new JsonWriter();
w4.writeFloat64(0);
console.log('writeFloat64(0):', new TextDecoder().decode(w4.toBytes()));
TSEOF
node --experimental-vm-modules test_ts_temp.mjs
rm -f test_ts_temp.mjs
cd - > /dev/null
echo ""

# ═══════════════════════════════════════════
# Go test (via podman)
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_go.go << 'GOEOF'
package main

import (
	"fmt"
	"math"
)

func main() {
	// f32 -0
	var f32_neg float32 = -0.0
	fmt.Printf("f32 -0: %.9f\n", f32_neg)
	fmt.Printf("f32 -0 signbit: %v\n", math.Signbit(float64(f32_neg)))
	
	// f32 0
	var f32_0 float32 = 0.0
	fmt.Printf("f32 0: %.9f\n", f32_0)
	fmt.Printf("f32 0 signbit: %v\n", math.Signbit(float64(f32_0)))
	
	// f64 -0
	var f64_neg float64 = -0.0
	fmt.Printf("f64 -0: %.17f\n", f64_neg)
	fmt.Printf("f64 -0 signbit: %v\n", math.Signbit(f64_neg))
	
	// f64 0
	var f64_0 float64 = 0.0
	fmt.Printf("f64 0: %.17f\n", f64_0)
	fmt.Printf("f64 0 signbit: %v\n", math.Signbit(f64_0))
}
GOEOF

echo "=== Go (via podman) ==="
podman run --rm -v /tmp/negzero_test:/test localhost/specodec-interop-go:latest sh -c "cd /test && go build -o test_go test_go.go && ./test_go" 2>&1 || echo "Go container not ready"
echo ""

# ═══════════════════════════════════════════
# Rust test (via podman)
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_rust.rs << 'RUSTEOF'
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
RUSTEOF

echo "=== Rust (via podman) ==="
podman run --rm -v /tmp/negzero_test:/test localhost/specodec-interop-rust:latest sh -c "cd /test && rustc --edition 2021 -o test_rust test_rust.rs && ./test_rust" 2>&1 || echo "Rust container not ready"
echo ""

# ═══════════════════════════════════════════
# Kotlin test (via podman)
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_kotlin.kt << 'KTEOF'
fun main() {
    // f32 -0
    val f32_neg: Float = -0.0f
    println("f32 -0: ${"%.9f".format(f32_neg)}")
    println("f32 -0 rawBits: ${f32_neg.toRawBits()}")
    println("f32 -0 is negative: ${(f32_neg.toRawBits() and 0x80000000.toInt()) != 0}")
    
    // f32 0
    val f32_0: Float = 0.0f
    println("f32 0: ${"%.9f".format(f32_0)}")
    println("f32 0 rawBits: ${f32_0.toRawBits()}")
    
    // f64 -0
    val f64_neg: Double = -0.0
    println("f64 -0: ${"%.17f".format(f64_neg)}")
    println("f64 -0 rawBits: ${f64_neg.toRawBits()}")
    println("f64 -0 is negative: ${(f64_neg.toRawBits() and 0x8000000000000000L) != 0L}")
    
    // f64 0
    val f64_0: Double = 0.0
    println("f64 0: ${"%.17f".format(f64_0)}")
    println("f64 0 rawBits: ${f64_0.toRawBits()}")
}
KTEOF

echo "=== Kotlin (via podman) ==="
podman run --rm -v /tmp/negzero_test:/test localhost/specodec-interop-kotlin:latest sh -c "cd /test && kotlinc test_kotlin.kt -include-runtime -d test_kotlin.jar && java -jar test_kotlin.jar" 2>&1 || echo "Kotlin container not ready"
echo ""

# ═══════════════════════════════════════════
# Dart test (via podman)
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_dart.dart << 'DARTEOF'
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
DARTEOF

echo "=== Dart (via podman) ==="
podman run --rm -v /tmp/negzero_test:/test localhost/specodec-interop-dart:latest sh -c "dart run /test/test_dart.dart" 2>&1 || echo "Dart container not ready"
echo ""

# ═══════════════════════════════════════════
# Swift test (via podman)
# ═══════════════════════════════════════════
cat > /tmp/negzero_test/test_swift.swift << 'SWIFTEOF'
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
SWIFTEOF

echo "=== Swift (via podman) ==="
podman run --rm -v /tmp/negzero_test:/test localhost/specodec-interop-swift:latest sh -c "swift /test/test_swift.swift" 2>&1 || echo "Swift container not ready"
echo ""

echo "=== SUMMARY ==="
echo "Expected outputs:"
echo "  f32 -0: -0.000000000"
echo "  f64 -0: -0.00000000000000000"
echo ""
echo "Languages that output without minus sign need fix!"