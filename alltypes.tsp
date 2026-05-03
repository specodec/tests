import "@typespec/http";

using TypeSpec.Http;

namespace AllTypes {

  model Inner {
    x: int32;
    y: int32;
  }

  model Coord {
    lat: float64;
    lng: float64;
  }

  model IdVal {
    id: string;
    value: int32;
  }

  model Label {
    key: string;
    text: string;
  }

  model Money {
    amount: int64;
    currency: string;
  }

  model Range32 {
    min: int32;
    max: int32;
  }

  model Addr {
    street: string;
    city: string;
    zip: string;
  }

  model Point3 {
    x: float64;
    y: float64;
    z: float64;
  }

  model OptInner {
    name?: string;
    score?: float64;
    tag?: string;
  }

  model SingleString {
    v: string;
  }

  model SingleBoolean {
    v: boolean;
  }

  model SingleInt8 {
    v: int8;
  }

  model SingleInt16 {
    v: int16;
  }

  model SingleInt32 {
    v: int32;
  }

  model SingleInt64 {
    v: int64;
  }

  model SingleUint8 {
    v: uint8;
  }

  model SingleUint16 {
    v: uint16;
  }

  model SingleUint32 {
    v: uint32;
  }

  model SingleUint64 {
    v: uint64;
  }

  model SingleFloat32 {
    v: float32;
  }

  model SingleFloat64 {
    v: float64;
  }

  model SingleBytes {
    v: bytes;
  }

  model OptSingleString {
    v?: string;
  }

  model OptSingleBoolean {
    v?: boolean;
  }

  model OptSingleInt8 {
    v?: int8;
  }

  model OptSingleInt16 {
    v?: int16;
  }

  model OptSingleInt32 {
    v?: int32;
  }

  model OptSingleInt64 {
    v?: int64;
  }

  model OptSingleUint8 {
    v?: uint8;
  }

  model OptSingleUint16 {
    v?: uint16;
  }

  model OptSingleUint32 {
    v?: uint32;
  }

  model OptSingleUint64 {
    v?: uint64;
  }

  model OptSingleFloat32 {
    v?: float32;
  }

  model OptSingleFloat64 {
    v?: float64;
  }

  model OptSingleBytes {
    v?: bytes;
  }

  model PairString {
    a: string;
    b: string;
  }

  model PairBoolean {
    a: boolean;
    b: boolean;
  }

  model PairInt8 {
    a: int8;
    b: int8;
  }

  model PairInt16 {
    a: int16;
    b: int16;
  }

  model PairInt32 {
    a: int32;
    b: int32;
  }

  model PairInt64 {
    a: int64;
    b: int64;
  }

  model PairUint8 {
    a: uint8;
    b: uint8;
  }

  model PairUint16 {
    a: uint16;
    b: uint16;
  }

  model PairUint32 {
    a: uint32;
    b: uint32;
  }

  model PairUint64 {
    a: uint64;
    b: uint64;
  }

  model PairFloat32 {
    a: float32;
    b: float32;
  }

  model PairFloat64 {
    a: float64;
    b: float64;
  }

  model PairBytes {
    a: bytes;
    b: bytes;
  }

  model DualStringInt32 {
    a: string;
    b: int32;
  }

  model DualStringBoolean {
    a: string;
    b: boolean;
  }

  model DualStringFloat64 {
    a: string;
    b: float64;
  }

  model DualStringBytes {
    a: string;
    b: bytes;
  }

  model DualInt32Boolean {
    a: int32;
    b: boolean;
  }

  model DualInt32Float64 {
    a: int32;
    b: float64;
  }

  model DualInt32Int64 {
    a: int32;
    b: int64;
  }

  model DualInt32Uint32 {
    a: int32;
    b: uint32;
  }

  model DualInt64Uint64 {
    a: int64;
    b: uint64;
  }

  model DualFloat32Float64 {
    a: float32;
    b: float64;
  }

  model DualFloat64Boolean {
    a: float64;
    b: boolean;
  }

  model DualFloat64Bytes {
    a: float64;
    b: bytes;
  }

  model DualUint32Uint64 {
    a: uint32;
    b: uint64;
  }

  model DualBooleanBytes {
    a: boolean;
    b: bytes;
  }

  model DualInt8Uint8 {
    a: int8;
    b: uint8;
  }

  model DualInt16Uint16 {
    a: int16;
    b: uint16;
  }

  model DualStringInt64 {
    a: string;
    b: int64;
  }

  model DualStringUint64 {
    a: string;
    b: uint64;
  }

  model DualInt32Bytes {
    a: int32;
    b: bytes;
  }

  model DualFloat64Int32 {
    a: float64;
    b: int32;
  }

  model DualBooleanInt32 {
    a: boolean;
    b: int32;
  }

  model DualBytesInt64 {
    a: bytes;
    b: int64;
  }

  model DualInt8Float32 {
    a: int8;
    b: float32;
  }

  model DualUint8Int16 {
    a: uint8;
    b: int16;
  }

  model DualInt64Float64 {
    a: int64;
    b: float64;
  }

  model DualUint64String {
    a: uint64;
    b: string;
  }

  model Triple01 {
    a: string;
    b: int32;
    c: boolean;
  }

  model Triple02 {
    a: float64;
    b: float64;
    c: float64;
  }

  model Triple03 {
    a: int32;
    b: int32;
    c: int32;
  }

  model Triple04 {
    a: string;
    b: string;
    c: int32;
  }

  model Triple05 {
    a: int64;
    b: string;
    c: boolean;
  }

  model Triple06 {
    a: uint32;
    b: uint64;
    c: string;
  }

  model Triple07 {
    a: bytes;
    b: string;
    c: int32;
  }

  model Triple08 {
    a: float32;
    b: int32;
    c: boolean;
  }

  model Triple09 {
    a: string;
    b: int64;
    c: float64;
  }

  model Triple10 {
    a: boolean;
    b: boolean;
    c: boolean;
  }

  model Triple11 {
    a: int8;
    b: int16;
    c: int32;
  }

  model Triple12 {
    a: uint8;
    b: uint16;
    c: uint32;
  }

  model Triple13 {
    a: string;
    b: bytes;
    c: float64;
  }

  model Triple14 {
    a: int64;
    b: uint64;
    c: boolean;
  }

  model Triple15 {
    a: float64;
    b: string;
    c: bytes;
  }

  model Five01 {
    f1: string;
    f2: int32;
    f3: boolean;
    f4: float64;
    f5: bytes;
  }

  model Five02 {
    f1: int32;
    f2: int32;
    f3: int32;
    f4: int32;
    f5: int32;
  }

  model Five03 {
    f1: string;
    f2: string;
    f3: string;
    f4: string;
    f5: string;
  }

  model Five04 {
    f1: float64;
    f2: int32;
    f3: string;
    f4: boolean;
    f5: bytes;
  }

  model Five05 {
    f1: int64;
    f2: uint64;
    f3: string;
    f4: float32;
    f5: int32;
  }

  model Five06 {
    f1: boolean;
    f2: string;
    f3: int32;
    f4: float64;
    f5: uint32;
  }

  model Five07 {
    f1: bytes;
    f2: bytes;
    f3: string;
    f4: int32;
    f5: float64;
  }

  model Five08 {
    f1: uint8;
    f2: uint16;
    f3: uint32;
    f4: int8;
    f5: int16;
  }

  model Five09 {
    f1: float32;
    f2: float64;
    f3: int32;
    f4: int64;
    f5: string;
  }

  model Five10 {
    f1: string;
    f2: boolean;
    f3: int64;
    f4: uint64;
    f5: float64;
  }

  model Ten01 {
    f1: string;
    f2: boolean;
    f3: int8;
    f4: int16;
    f5: int32;
    f6: int64;
    f7: uint8;
    f8: uint16;
    f9: uint32;
    f10: uint64;
  }

  model Ten02 {
    f1: int16;
    f2: int32;
    f3: int64;
    f4: uint8;
    f5: uint16;
    f6: uint32;
    f7: uint64;
    f8: float32;
    f9: float64;
    f10: bytes;
  }

  model Ten03 {
    f1: uint8;
    f2: uint16;
    f3: uint32;
    f4: uint64;
    f5: float32;
    f6: float64;
    f7: bytes;
    f8: string;
    f9: boolean;
    f10: int8;
  }

  model Ten04 {
    f1: uint64;
    f2: float32;
    f3: float64;
    f4: bytes;
    f5: string;
    f6: boolean;
    f7: int8;
    f8: int16;
    f9: int32;
    f10: int64;
  }

  model Ten05 {
    f1: bytes;
    f2: string;
    f3: boolean;
    f4: int8;
    f5: int16;
    f6: int32;
    f7: int64;
    f8: uint8;
    f9: uint16;
    f10: uint32;
  }

  model ArrString {
    items: string[];
  }

  model ArrInt32 {
    items: int32[];
  }

  model ArrBoolean {
    items: boolean[];
  }

  model ArrFloat64 {
    items: float64[];
  }

  model ArrBytes {
    items: bytes[];
  }

  model ArrInt64 {
    items: int64[];
  }

  model ArrUint64 {
    items: uint64[];
  }

  model MultiArr1 {
    names: string[];
    scores: int32[];
  }

  model MultiArr2 {
    flags: boolean[];
    values: float64[];
    data: bytes[];
  }

  model MultiArr3 {
    a: string[];
    b: int32[];
    c: float64[];
  }

  model MultiArr4 {
    ids: int64[];
    tags: string[];
  }

  model MultiArr5 {
    xs: uint64[];
    ys: float32[];
    zs: boolean[];
  }

  model OptCombo1 {
    req: string;
    opt_a?: int32;
  }

  model OptCombo2 {
    req: string;
    opt_a?: int32;
    opt_b?: boolean;
  }

  model OptCombo3 {
    req: string;
    opt_a?: int32;
    opt_b?: boolean;
    opt_c?: float64;
  }

  model OptCombo4 {
    req: int32;
    opt_a?: string;
    opt_b?: bytes;
  }

  model OptCombo5 {
    req1: string;
    req2: int32;
    opt_a?: boolean;
    opt_b?: float64;
  }

  model OptCombo6 {
    req: string;
    opt_s?: string;
    opt_i?: int32;
    opt_f?: float64;
    opt_b?: bytes;
  }

  model OptCombo7 {
    req: int64;
    opt_u64?: uint64;
    opt_str?: string;
  }

  model OptCombo8 {
    a: string;
    b?: int32;
    c?: float64;
    d?: boolean;
    e?: bytes;
    f?: int64;
  }

  model OptCombo9 {
    id: string;
    name?: string;
    age?: int32;
    score?: float64;
  }

  model OptCombo10 {
    code: int32;
    msg?: string;
    detail?: string;
    retry?: boolean;
  }

  model NestInner {
    inner: Inner;
  }

  model NestCoord {
    inner: Coord;
  }

  model NestIdVal {
    inner: IdVal;
  }

  model NestLabel {
    inner: Label;
  }

  model NestMoney {
    inner: Money;
  }

  model NestRange32 {
    inner: Range32;
  }

  model NestAddr {
    inner: Addr;
  }

  model NestPoint3 {
    inner: Point3;
  }

  model OptNestInner {
    label: string;
    inner?: Inner;
  }

  model OptNestCoord {
    label: string;
    inner?: Coord;
  }

  model OptNestIdVal {
    label: string;
    inner?: IdVal;
  }

  model OptNestLabel {
    label: string;
    inner?: Label;
  }

  model OptNestMoney {
    label: string;
    inner?: Money;
  }

  model OptNestRange32 {
    label: string;
    inner?: Range32;
  }

  model OptNestAddr {
    label: string;
    inner?: Addr;
  }

  model OptNestPoint3 {
    label: string;
    inner?: Point3;
  }

  model ModelArr1 {
    points: Inner[];
  }

  model ModelArr2 {
    coords: Coord[];
  }

  model ModelArr3 {
    items: IdVal[];
    tag: string;
  }

  model ModelArr4 {
    labels: Label[];
    count: int32;
  }

  model ModelArr5 {
    arr: Money[];
    bs: Addr[];
  }

  model Mix01 {
    name: string;
    value: int32;
    point: Inner;
  }

  model Mix02 {
    id: string;
    loc: Coord;
    tags: string[];
  }

  model Mix03 {
    label: string;
    range: Range32;
    active: boolean;
  }

  model Mix04 {
    title: string;
    price: Money;
    inStock: boolean;
    rating: float64;
  }

  model Mix05 {
    addr: Addr;
    coords: Coord[];
  }

  model Mix06 {
    name: string;
    age: int32;
    address?: Addr;
    email?: string;
  }

  model Mix07 {
    origin: Point3;
    dest: Point3;
    distance: float64;
  }

  model Mix08 {
    keys: string[];
    values: int32[];
    meta?: Label;
  }

  model Mix09 {
    id: int64;
    data: bytes;
    checksum: uint32;
    prev?: IdVal;
  }

  model Mix10 {
    items: string[];
    total: int32;
    avg: float64;
    range: Range32;
  }

  model Mix11 {
    name: string;
    values: float64[];
    inner?: Inner;
    flag?: boolean;
  }

  model Mix12 {
    header: string;
    entries: IdVal[];
    footer?: string;
  }

  model Mix13 {
    a: int32;
    b: float64;
    c: string;
    d: boolean;
    e: bytes;
    inner: Inner;
  }

  model Mix14 {
    amounts: Money[];
    total: int64;
    currency: string;
  }

  model Mix15 {
    from: Addr;
    to: Addr;
    distance: float64;
    duration: float64;
  }

  model AllOpt1 {
    a?: string;
    b?: int32;
    c?: boolean;
  }

  model AllOpt2 {
    x?: float64;
    y?: bytes;
    z?: int64;
  }

  model AllOpt3 {
    name?: string;
    age?: int32;
    score?: float64;
    active?: boolean;
  }

  model AllOpt4 {
    a?: uint32;
    b?: uint64;
    c?: int32;
    d?: string;
    e?: bytes;
  }

  model AllOpt5 {
    p?: Inner;
    q?: string;
  }

  model RecList {
    value: int32;
    next?: RecList;
  }

  model RecTree {
    value: string;
    left?: RecTree;
    right?: RecTree;
  }

  model RecChain {
    id: int32;
    label: string;
    next?: RecChain;
  }

  model RecWrap {
    data: bytes;
    inner?: RecWrap;
  }

  model RecWide {
    a: int32;
    b: string;
    c: float64;
    child?: RecWide;
  }

  model Wide20 {
    f1: string;
    f2: boolean;
    f3: int8;
    f4: int16;
    f5: int32;
    f6: int64;
    f7: uint8;
    f8: uint16;
    f9: uint32;
    f10: uint64;
    f11: float32;
    f12: float64;
    f13: bytes;
    f14: string;
    f15: boolean;
    f16: int8;
    f17: int16;
    f18: int32;
    f19: int64;
    f20: uint8;
  }

  model Wide25 {
    f1: uint16;
    f2: uint32;
    f3: uint64;
    f4: float32;
    f5: float64;
    f6: bytes;
    f7: string;
    f8: boolean;
    f9: int8;
    f10: int16;
    f11: int32;
    f12: int64;
    f13: uint8;
    f14: uint16;
    f15: uint32;
    f16: uint64;
    f17: float32;
    f18: float64;
    f19: bytes;
    f20: string;
    f21: boolean;
    f22: int8;
    f23: int16;
    f24: int32;
    f25: int64;
  }

  model Wide30 {
    f1: boolean;
    f2: int8;
    f3: int16;
    f4: int32;
    f5: int64;
    f6: uint8;
    f7: uint16;
    f8: uint32;
    f9: uint64;
    f10: float32;
    f11: float64;
    f12: bytes;
    f13: string;
    f14: boolean;
    f15: int8;
    f16: int16;
    f17: int32;
    f18: int64;
    f19: uint8;
    f20: uint16;
    f21: uint32;
    f22: uint64;
    f23: float32;
    f24: float64;
    f25: bytes;
    f26: string;
    f27: boolean;
    f28: int8;
    f29: int16;
    f30: int32;
  }

  model Wide35 {
    f1: uint32;
    f2: uint64;
    f3: float32;
    f4: float64;
    f5: bytes;
    f6: string;
    f7: boolean;
    f8: int8;
    f9: int16;
    f10: int32;
    f11: int64;
    f12: uint8;
    f13: uint16;
    f14: uint32;
    f15: uint64;
    f16: float32;
    f17: float64;
    f18: bytes;
    f19: string;
    f20: boolean;
    f21: int8;
    f22: int16;
    f23: int32;
    f24: int64;
    f25: uint8;
    f26: uint16;
    f27: uint32;
    f28: uint64;
    f29: float32;
    f30: float64;
    f31: bytes;
    f32: string;
    f33: boolean;
    f34: int8;
    f35: int16;
  }

  model Wide40 {
    f1: int8;
    f2: int16;
    f3: int32;
    f4: int64;
    f5: uint8;
    f6: uint16;
    f7: uint32;
    f8: uint64;
    f9: float32;
    f10: float64;
    f11: bytes;
    f12: string;
    f13: boolean;
    f14: int8;
    f15: int16;
    f16: int32;
    f17: int64;
    f18: uint8;
    f19: uint16;
    f20: uint32;
    f21: uint64;
    f22: float32;
    f23: float64;
    f24: bytes;
    f25: string;
    f26: boolean;
    f27: int8;
    f28: int16;
    f29: int32;
    f30: int64;
    f31: uint8;
    f32: uint16;
    f33: uint32;
    f34: uint64;
    f35: float32;
    f36: float64;
    f37: bytes;
    f38: string;
    f39: boolean;
    f40: int8;
  }

  model EdgeEmpty {
  }

  model EdgeOneOpt {
    maybe?: string;
  }

  model EdgeBigNums {
    i8: int8;
    i16: int16;
    i32: int32;
    i64: int64;
    u8: uint8;
    u16: uint16;
    u32: uint32;
    u64: uint64;
  }

  model EdgeZeroVals {
    s: string;
    i: int32;
    f: float64;
    b: boolean;
    by: bytes;
  }

  model EdgeNullable {
    a?: string;
    b?: int32;
    c?: Inner;
    d?: string[];
  }

  model EdgeNegZero {
    v: float64;
  }

  model EdgeNullByte {
    s: string;
    b: bytes;
  }

  model EdgeBoundary {
    i32_neg129: int32;
    i32_128: int32;
    i32_256: int32;
    i32_65536: int32;
    i32_neg32769: int32;
    u32_65536: uint32;
  }

  model EdgeStrLen {
    s31: string;
    s32: string;
    s255: string;
    s256: string;
  }

  model EdgeBytesLen {
    b31: bytes;
    b32: bytes;
    b255: bytes;
    b256: bytes;
  }

  model EdgeArrEmpty {
    items: string[];
  }

  model EdgeArrBoundary {
    a15: int32[];
    a16: int32[];
  }

  model OptArr1 {
    req: string;
    items?: int32[];
  }

  model OptArr2 {
    id: int32;
    names?: string[];
    flags?: boolean[];
  }

  model OptArr3 {
    a?: string[];
    b?: float64[];
  }

  model OptArr4 {
    data: bytes;
    chunks?: bytes[];
  }

  model OptArr5 {
    models?: Inner[];
    name: string;
  }

  model NestOpt1 {
    outer: Label;
    name: string;
  }

  model NestOpt2 {
    a?: IdVal;
    b?: IdVal;
    c?: IdVal;
  }

  model NestOpt3 {
    money: Money;
    range?: Range32;
  }

  model NestOpt4 {
    addr?: Addr;
    coord?: Coord;
    name: string;
  }

  model NestOpt5 {
    point: Point3;
    addr: Addr;
    label?: Label;
  }

  model NestOptInner1 {
    tag: string;
    inner?: OptInner;
  }

  model NestOptInner2 {
    tag: string;
    inner: OptInner;
  }

  model NestOptInner3 {
    outer?: OptInner;
    inner?: OptInner;
  }

  model DeepNest1 {
    label: string;
    inner: Addr;
  }

  model DeepNest2 {
    name: string;
    money: Money;
    addr: Addr;
  }

  model DeepNest3 {
    title: string;
    point: Point3;
    range: Range32;
    money: Money;
  }

  model DeepNest4 {
    coords: Coord[];
    inner: Inner;
    tag: string;
  }

  model DeepNest5 {
    labels: Label[];
    money: Money;
    name: string;
  }

  model DeepNest6 {
    items: IdVal[];
    addr?: Addr;
    coord: Coord;
  }

  model DeepNest7 {
    a: Addr;
    b: Addr;
    c: Addr;
  }

  model TimestampEntry {
    ts: int64;
    event: string;
    data?: bytes;
  }

  model ConfigEntry {
    key: string;
    intValue?: int32;
    strValue?: string;
    boolValue?: boolean;
    floatValue?: float64;
  }

  interface TestService {
    @post echoOptInner(...OptInner): OptInner;
    @post echoSingleString(...SingleString): SingleString;
    @post echoSingleBoolean(...SingleBoolean): SingleBoolean;
    @post echoSingleInt8(...SingleInt8): SingleInt8;
    @post echoSingleInt16(...SingleInt16): SingleInt16;
    @post echoSingleInt32(...SingleInt32): SingleInt32;
    @post echoSingleInt64(...SingleInt64): SingleInt64;
    @post echoSingleUint8(...SingleUint8): SingleUint8;
    @post echoSingleUint16(...SingleUint16): SingleUint16;
    @post echoSingleUint32(...SingleUint32): SingleUint32;
    @post echoSingleUint64(...SingleUint64): SingleUint64;
    @post echoSingleFloat32(...SingleFloat32): SingleFloat32;
    @post echoSingleFloat64(...SingleFloat64): SingleFloat64;
    @post echoSingleBytes(...SingleBytes): SingleBytes;
    @post echoOptSingleString(...OptSingleString): OptSingleString;
    @post echoOptSingleBoolean(...OptSingleBoolean): OptSingleBoolean;
    @post echoOptSingleInt8(...OptSingleInt8): OptSingleInt8;
    @post echoOptSingleInt16(...OptSingleInt16): OptSingleInt16;
    @post echoOptSingleInt32(...OptSingleInt32): OptSingleInt32;
    @post echoOptSingleInt64(...OptSingleInt64): OptSingleInt64;
    @post echoOptSingleUint8(...OptSingleUint8): OptSingleUint8;
    @post echoOptSingleUint16(...OptSingleUint16): OptSingleUint16;
    @post echoOptSingleUint32(...OptSingleUint32): OptSingleUint32;
    @post echoOptSingleUint64(...OptSingleUint64): OptSingleUint64;
    @post echoOptSingleFloat32(...OptSingleFloat32): OptSingleFloat32;
    @post echoOptSingleFloat64(...OptSingleFloat64): OptSingleFloat64;
    @post echoOptSingleBytes(...OptSingleBytes): OptSingleBytes;
    @post echoPairString(...PairString): PairString;
    @post echoPairBoolean(...PairBoolean): PairBoolean;
    @post echoPairInt8(...PairInt8): PairInt8;
    @post echoPairInt16(...PairInt16): PairInt16;
    @post echoPairInt32(...PairInt32): PairInt32;
    @post echoPairInt64(...PairInt64): PairInt64;
    @post echoPairUint8(...PairUint8): PairUint8;
    @post echoPairUint16(...PairUint16): PairUint16;
    @post echoPairUint32(...PairUint32): PairUint32;
    @post echoPairUint64(...PairUint64): PairUint64;
    @post echoPairFloat32(...PairFloat32): PairFloat32;
    @post echoPairFloat64(...PairFloat64): PairFloat64;
    @post echoPairBytes(...PairBytes): PairBytes;
    @post echoDualStringInt32(...DualStringInt32): DualStringInt32;
    @post echoDualStringBoolean(...DualStringBoolean): DualStringBoolean;
    @post echoDualStringFloat64(...DualStringFloat64): DualStringFloat64;
    @post echoDualStringBytes(...DualStringBytes): DualStringBytes;
    @post echoDualInt32Boolean(...DualInt32Boolean): DualInt32Boolean;
    @post echoDualInt32Float64(...DualInt32Float64): DualInt32Float64;
    @post echoDualInt32Int64(...DualInt32Int64): DualInt32Int64;
    @post echoDualInt32Uint32(...DualInt32Uint32): DualInt32Uint32;
    @post echoDualInt64Uint64(...DualInt64Uint64): DualInt64Uint64;
    @post echoDualFloat32Float64(...DualFloat32Float64): DualFloat32Float64;
    @post echoDualFloat64Boolean(...DualFloat64Boolean): DualFloat64Boolean;
    @post echoDualFloat64Bytes(...DualFloat64Bytes): DualFloat64Bytes;
    @post echoDualUint32Uint64(...DualUint32Uint64): DualUint32Uint64;
    @post echoDualBooleanBytes(...DualBooleanBytes): DualBooleanBytes;
    @post echoDualInt8Uint8(...DualInt8Uint8): DualInt8Uint8;
    @post echoDualInt16Uint16(...DualInt16Uint16): DualInt16Uint16;
    @post echoDualStringInt64(...DualStringInt64): DualStringInt64;
    @post echoDualStringUint64(...DualStringUint64): DualStringUint64;
    @post echoDualInt32Bytes(...DualInt32Bytes): DualInt32Bytes;
    @post echoDualFloat64Int32(...DualFloat64Int32): DualFloat64Int32;
    @post echoDualBooleanInt32(...DualBooleanInt32): DualBooleanInt32;
    @post echoDualBytesInt64(...DualBytesInt64): DualBytesInt64;
    @post echoDualInt8Float32(...DualInt8Float32): DualInt8Float32;
    @post echoDualUint8Int16(...DualUint8Int16): DualUint8Int16;
    @post echoDualInt64Float64(...DualInt64Float64): DualInt64Float64;
    @post echoDualUint64String(...DualUint64String): DualUint64String;
    @post echoTriple01(...Triple01): Triple01;
    @post echoTriple02(...Triple02): Triple02;
    @post echoTriple03(...Triple03): Triple03;
    @post echoTriple04(...Triple04): Triple04;
    @post echoTriple05(...Triple05): Triple05;
    @post echoTriple06(...Triple06): Triple06;
    @post echoTriple07(...Triple07): Triple07;
    @post echoTriple08(...Triple08): Triple08;
    @post echoTriple09(...Triple09): Triple09;
    @post echoTriple10(...Triple10): Triple10;
    @post echoTriple11(...Triple11): Triple11;
    @post echoTriple12(...Triple12): Triple12;
    @post echoTriple13(...Triple13): Triple13;
    @post echoTriple14(...Triple14): Triple14;
    @post echoTriple15(...Triple15): Triple15;
    @post echoFive01(...Five01): Five01;
    @post echoFive02(...Five02): Five02;
    @post echoFive03(...Five03): Five03;
    @post echoFive04(...Five04): Five04;
    @post echoFive05(...Five05): Five05;
    @post echoFive06(...Five06): Five06;
    @post echoFive07(...Five07): Five07;
    @post echoFive08(...Five08): Five08;
    @post echoFive09(...Five09): Five09;
    @post echoFive10(...Five10): Five10;
    @post echoTen01(...Ten01): Ten01;
    @post echoTen02(...Ten02): Ten02;
    @post echoTen03(...Ten03): Ten03;
    @post echoTen04(...Ten04): Ten04;
    @post echoTen05(...Ten05): Ten05;
    @post echoArrString(...ArrString): ArrString;
    @post echoArrInt32(...ArrInt32): ArrInt32;
    @post echoArrBoolean(...ArrBoolean): ArrBoolean;
    @post echoArrFloat64(...ArrFloat64): ArrFloat64;
    @post echoArrBytes(...ArrBytes): ArrBytes;
    @post echoArrInt64(...ArrInt64): ArrInt64;
    @post echoArrUint64(...ArrUint64): ArrUint64;
    @post echoMultiArr1(...MultiArr1): MultiArr1;
    @post echoMultiArr2(...MultiArr2): MultiArr2;
    @post echoMultiArr3(...MultiArr3): MultiArr3;
    @post echoMultiArr4(...MultiArr4): MultiArr4;
    @post echoMultiArr5(...MultiArr5): MultiArr5;
    @post echoOptCombo1(...OptCombo1): OptCombo1;
    @post echoOptCombo2(...OptCombo2): OptCombo2;
    @post echoOptCombo3(...OptCombo3): OptCombo3;
    @post echoOptCombo4(...OptCombo4): OptCombo4;
    @post echoOptCombo5(...OptCombo5): OptCombo5;
    @post echoOptCombo6(...OptCombo6): OptCombo6;
    @post echoOptCombo7(...OptCombo7): OptCombo7;
    @post echoOptCombo8(...OptCombo8): OptCombo8;
    @post echoOptCombo9(...OptCombo9): OptCombo9;
    @post echoOptCombo10(...OptCombo10): OptCombo10;
    @post echoNestInner(...NestInner): NestInner;
    @post echoNestCoord(...NestCoord): NestCoord;
    @post echoNestIdVal(...NestIdVal): NestIdVal;
    @post echoNestLabel(...NestLabel): NestLabel;
    @post echoNestMoney(...NestMoney): NestMoney;
    @post echoNestRange32(...NestRange32): NestRange32;
    @post echoNestAddr(...NestAddr): NestAddr;
    @post echoNestPoint3(...NestPoint3): NestPoint3;
    @post echoOptNestInner(...OptNestInner): OptNestInner;
    @post echoOptNestCoord(...OptNestCoord): OptNestCoord;
    @post echoOptNestIdVal(...OptNestIdVal): OptNestIdVal;
    @post echoOptNestLabel(...OptNestLabel): OptNestLabel;
    @post echoOptNestMoney(...OptNestMoney): OptNestMoney;
    @post echoOptNestRange32(...OptNestRange32): OptNestRange32;
    @post echoOptNestAddr(...OptNestAddr): OptNestAddr;
    @post echoOptNestPoint3(...OptNestPoint3): OptNestPoint3;
    @post echoModelArr1(...ModelArr1): ModelArr1;
    @post echoModelArr2(...ModelArr2): ModelArr2;
    @post echoModelArr3(...ModelArr3): ModelArr3;
    @post echoModelArr4(...ModelArr4): ModelArr4;
    @post echoModelArr5(...ModelArr5): ModelArr5;
    @post echoMix01(...Mix01): Mix01;
    @post echoMix02(...Mix02): Mix02;
    @post echoMix03(...Mix03): Mix03;
    @post echoMix04(...Mix04): Mix04;
    @post echoMix05(...Mix05): Mix05;
    @post echoMix06(...Mix06): Mix06;
    @post echoMix07(...Mix07): Mix07;
    @post echoMix08(...Mix08): Mix08;
    @post echoMix09(...Mix09): Mix09;
    @post echoMix10(...Mix10): Mix10;
    @post echoMix11(...Mix11): Mix11;
    @post echoMix12(...Mix12): Mix12;
    @post echoMix13(...Mix13): Mix13;
    @post echoMix14(...Mix14): Mix14;
    @post echoMix15(...Mix15): Mix15;
    @post echoAllOpt1(...AllOpt1): AllOpt1;
    @post echoAllOpt2(...AllOpt2): AllOpt2;
    @post echoAllOpt3(...AllOpt3): AllOpt3;
    @post echoAllOpt4(...AllOpt4): AllOpt4;
    @post echoAllOpt5(...AllOpt5): AllOpt5;
    @post echoRecList(...RecList): RecList;
    @post echoRecTree(...RecTree): RecTree;
    @post echoRecChain(...RecChain): RecChain;
    @post echoRecWrap(...RecWrap): RecWrap;
    @post echoRecWide(...RecWide): RecWide;
    @post echoWide20(...Wide20): Wide20;
    @post echoWide25(...Wide25): Wide25;
    @post echoWide30(...Wide30): Wide30;
    @post echoWide35(...Wide35): Wide35;
    @post echoWide40(...Wide40): Wide40;
    @post echoEdgeEmpty(...EdgeEmpty): EdgeEmpty;
    @post echoEdgeOneOpt(...EdgeOneOpt): EdgeOneOpt;
    @post echoEdgeBigNums(...EdgeBigNums): EdgeBigNums;
    @post echoEdgeZeroVals(...EdgeZeroVals): EdgeZeroVals;
    @post echoEdgeNullable(...EdgeNullable): EdgeNullable;
    @post echoEdgeNegZero(...EdgeNegZero): EdgeNegZero;
    @post echoEdgeNullByte(...EdgeNullByte): EdgeNullByte;
    @post echoEdgeBoundary(...EdgeBoundary): EdgeBoundary;
    @post echoEdgeStrLen(...EdgeStrLen): EdgeStrLen;
    @post echoEdgeBytesLen(...EdgeBytesLen): EdgeBytesLen;
    @post echoEdgeArrEmpty(...EdgeArrEmpty): EdgeArrEmpty;
    @post echoEdgeArrBoundary(...EdgeArrBoundary): EdgeArrBoundary;
    @post echoOptArr1(...OptArr1): OptArr1;
    @post echoOptArr2(...OptArr2): OptArr2;
    @post echoOptArr3(...OptArr3): OptArr3;
    @post echoOptArr4(...OptArr4): OptArr4;
    @post echoOptArr5(...OptArr5): OptArr5;
    @post echoNestOpt1(...NestOpt1): NestOpt1;
    @post echoNestOpt2(...NestOpt2): NestOpt2;
    @post echoNestOpt3(...NestOpt3): NestOpt3;
    @post echoNestOpt4(...NestOpt4): NestOpt4;
    @post echoNestOpt5(...NestOpt5): NestOpt5;
    @post echoNestOptInner1(...NestOptInner1): NestOptInner1;
    @post echoNestOptInner2(...NestOptInner2): NestOptInner2;
    @post echoNestOptInner3(...NestOptInner3): NestOptInner3;
    @post echoDeepNest1(...DeepNest1): DeepNest1;
    @post echoDeepNest2(...DeepNest2): DeepNest2;
    @post echoDeepNest3(...DeepNest3): DeepNest3;
    @post echoDeepNest4(...DeepNest4): DeepNest4;
    @post echoDeepNest5(...DeepNest5): DeepNest5;
    @post echoDeepNest6(...DeepNest6): DeepNest6;
    @post echoDeepNest7(...DeepNest7): DeepNest7;
    @post echoTimestampEntry(...TimestampEntry): TimestampEntry;
    @post echoConfigEntry(...ConfigEntry): ConfigEntry;
  }
}
