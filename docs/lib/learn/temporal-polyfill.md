# temporal-polyfill で始める日付バリデーション

[`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill) は Temporal 提案仕様の軽量実装です。不正な入力を自動補正せず `RangeError` を投げるため、日付バリデーションにそのまま活用できます。

## 1. インストールと読み込み

```bash
npm install temporal-polyfill
```

用途に応じて読み込み方を選びます。

```ts
// ESM/CJS で Temporal 名前空間を直接使う
import { Temporal } from "temporal-polyfill";

// グローバルに注入したい場合
import "temporal-polyfill/global"; // globalThis.Temporal が定義される
```

ブラウザは CDN で手軽に試せます。

```html
<script src="https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.0/global.min.js"></script>
<script>
  console.log(Temporal.PlainDate.from("2024-12-25").toString());
</script>
```

## 2. ISO 文字列の検証

`Temporal.PlainDate.from()` は ISO 形式 (`YYYY-MM-DD`) をパースし、無効な入力は `RangeError` を投げます。

```ts
function isValidIsoDate(input: string): boolean {
  try {
    Temporal.PlainDate.from(input);
    return true;
  } catch (error) {
    return false;
  }
}
```

内部実装を覗くと、`PlainDate.from()` が `parsePlainDate()` を呼び、そこで `RangeError` が投げられているのが確認できます。

```ts
// packages/temporal-polyfill/src/classApi/plainDate.ts:214
from(arg: any, options?: OverflowOptions): PlainDate {
  return createPlainDate(toPlainDateSlots(arg, options));
}

// packages/temporal-polyfill/src/internal/isoParse.ts:172
if (!organized || organized.hasZ) {
  throw new RangeError(errorMessages.failedParse(s));
}
```

`RangeError` を捕まえるだけでフォーマット・存在チェックを一度に行えるのが大きな利点です。

## 3. 年月日入力の組み立て

フォームで年・月・日に分かれた数値を受け取った場合は、オブジェクト経由で `from` を呼びます。

```ts
function fromFields(year: number, month: number, day: number) {
  try {
    return Temporal.PlainDate.from({ year, month, day });
  } catch {
    return null; // ありえない日付 (例: 2025-02-29)
  }
}
```

`new Date(year, month - 1, day)` のように自動補正される挙動とは異なり、存在しない日付は確実に弾かれます。

## 4. 範囲チェックとソート

`Temporal.PlainDate.compare(a, b)` は `a < b` なら `-1`、`a === b` なら `0`、`a > b` なら `1` を返します。これを利用して上下限チェックができます。

```ts
const min = Temporal.PlainDate.from("2020-01-01");
const max = Temporal.PlainDate.from("2030-12-31");

function isInRange(input: string) {
  try {
    const value = Temporal.PlainDate.from(input);
    return (
      Temporal.PlainDate.compare(value, min) >= 0 && Temporal.PlainDate.compare(value, max) <= 0
    );
  } catch {
    return false;
  }
}
```

## 5. 正常化と表示

バリデーション後は `PlainDate` インスタンスを保持しておくと便利です。

- `date.toString()` は常に `YYYY-MM-DD`
- `date.toJSON()` も同じく ISO 文字列
- カスタム表示は `Intl.DateTimeFormat` や `Temporal.Now` と組み合わせる

```ts
const date = Temporal.PlainDate.from("2024-07-01");
const formatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
console.log(formatter.format(date.toZonedDateTime("UTC").epochMilliseconds));
```

## 6. 小さな Tips

- 例外は主に `RangeError`。`TypeError` が出るときは引数の型を誤っているケースが多い。
- `Temporal.Now.plainDateISO()` を使えばローカルタイムゾーン基準の「今日」を `PlainDate` で取得できる。
- Node.js ではまだネイティブ実装がない場合でも、このポリフィルで同じコードを動かせる。

## 参考リンク

- GitHub: https://github.com/fullcalendar/temporal-polyfill
- Temporal 仕様: https://tc39.es/proposal-temporal/docs/
