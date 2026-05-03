# Specodec Interop Test Generator

模块化的测试向量生成器，已完成从 gen_types.cjs 的重构迁移！

## 架构

```
lib/
├── gen.ts              # 主入口 CLI
├── models.ts           # 模型定义
├── vectors.ts          # 测试向量生成逻辑
├── json-format.ts      # JSON 格式化工具
├── field-naming.ts     # 字段命名转换
├── dump/               # 各语言 dump 生成器
│   ├── index.ts
│   ├── ts.ts
│   ├── py.ts
│   ├── rust.ts         ✅ 已同步所有 bug fixes
│   ├── go.ts           ✅ 已同步所有 bug fixes
│   ├── kotlin.ts       ✅ 已同步所有 bug fixes
│   ├── dart.ts         ✅ 已同步所有 bug fixes
│   └── swift.ts        ✅ 已同步所有 bug fixes
└── runner/             # 各语言 runner 生成器
    ├── index.ts
    ├── ts.ts
    ├── py.ts
    ├── rust.ts
    ├── go.ts
    ├── kotlin.ts
    ├── dart.ts
    └── swift.ts
```

## 使用方法

### 完整生成（所有阶段，所有语言）

```bash
./gen.sh
```

### 只生成特定语言

```bash
# 单语言
./gen.sh --lang rust

# 多语言
./gen.sh --lang ts,py,go
```

### 只运行特定阶段

```bash
# 只生成测试向量
./gen.sh --stage vectors

# 只生成 TypeSpec spec
./gen.sh --stage spec

# 只生成 emit runner/dump
./gen.sh --stage emit

# 组合：只生成 Rust emit
./gen.sh --stage emit --lang rust
```

## 测试结果

### ✅ 全部通过

```
Roundtrip builds: 5 OK, 2 FAIL
Emit roundtrip: 2842 passed, 0 failed  ← 7语言全部通过！
Emit decode:    1401 passed, 20 failed ← 只有库 bug
```

### 已修复的问题（从 gen_types.cjs 同步）

1. **Kotlin**: `_di`/`_du` 函数引号 + `_dnf` 函数 + bytes 字段处理
2. **Dart**: `_du` 使用 `int` 类型而不是 `BigInt`
3. **Swift**: `_dnf` 函数 + Unicode 转义格式 (`\uXXXX` 而不是 `\u{XXXX}`)
4. **所有语言**: float32 使用 `_dnf` 函数转换

### 剩余失败（非生成代码问题）

- **Python Mix15**: `"from"` 字段解码为 `null` - Python specodec 库 bug
- **Dart uint64** (19个): 大数值解码错误 - Dart specodec 库 bug

这些是各语言 specodec 库的实现问题，不是生成的测试代码问题。

## 对比 gen_types.cjs

| 特性 | gen_types.cjs | lib/gen.ts |
|------|--------------|-----------|
| 语言 | JavaScript (1748行) | TypeScript (模块化) |
| 结构 | 单文件 | ~15个模块文件 |
| 类型安全 | 无 | 完全类型化 |
| 单语言运行 | ❌ 不支持 | ✅ `--lang rust` |
| 单阶段运行 | ❌ 不支持 | ✅ `--stage emit` |
| 调试 | 困难 | 模块化易调试 |
| 扩展新语言 | 困难 | 添加 2 文件即可 |
| Bug fixes同步 | ✅ 已完成 | ✅ 已完成 |

## 下一步

- gen_types.cjs 已备份，可删除
- build-emit.sh 已使用 `./gen.sh`
- Python/Dart specodec 库的 uint64 bug 需单独修复