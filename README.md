# ZK P2P Rock-Paper-Scissors

ゼロ知識証明（ZK）を活用し、中央サーバーを一切介さずにピアツーピア（P2P）で対戦する、究極にプライベートでセキュアなジャンケンゲームです。

## ただのジャンケンに、なぜこれほど高度な技術を？

そうだね。

## 対戦のフェーズ

1. **P2P接続**:
   WebRTCによる手動シグナリングを使用して、プレイヤー同士が直接つながります。サーバーを経由しないため、あなたの通信ログがどこかに残ることはありません。
2. **コミット (Phase 1)**:
   プレイヤーは自分の「手」（グー・チョキ・パー）を選択し、それを秘密の数値（Salt）と共にハッシュ化して送信します。この時、ZK証明によって「0, 1, 2のいずれかの正当な手を出していること」のみが相手に証明され、具体的な手は隠されたままです。
3. **公開 (Phase 2)**:
   両プレイヤーの手が出揃った後、自分の手を公開（Reveal）します。ZK証明により、「公開した手が、最初にコミットした手と同一であること」が数学的に保証されます。後出しや、コミットした後の変更は不可能です。

## 必要条件

- **Bun**: ランタイムおよびパッケージマネージャー
- **Circom**: 回路のコンパイルに必要（インストールされていない場合はスクリプトが自動的に試行します）

## セットアップ

### 依存関係のインストール

```bash
bun install
```

### 回路（Circuits）のビルド

以下のコマンドを実行して、ZK回路のコンパイルとTrusted Setup（Groth16）の生成を行います。

```bash
bun run generate
```

> **注意**: このコマンドは開発・テスト用のTrusted Setupを生成します。

### 開発サーバーの起動

```bash
bun dev
```

## 技術スタック

- **Frontend**: React + Vite
- **P2P Communication**: WebRTC DataChannels (Manual Signaling)
- **Zero-Knowledge Proofs**: SnarkJS + Circom (Groth16)
- **Hashing**: Poseidon Hash (ZK-friendly)
- **State Management**: Zustand

## ディレクトリ構成

- `circuits/`: `.circom` 回路定義
- `scripts/`: 回路ビルド用スクリプト
- `src/lib/`: P2P、ZK、暗号化のコアロジック
- `public/circuits/`: ビルド済みのWASM、zkeyファイルなど
