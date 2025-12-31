import Link from 'next/link';
import styles from './page.module.css';
import HomeStats from './components/HomeStats';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>行政書士<br />試験勉強</h1>
        <p className={styles.subtitle}>
          Gemini AIがあなたの合格をサポート。<br />
          質の高い問題演習と詳細な解説で、<br />合格への最短ルートを。
        </p>
      </div>

      {/* 復習セクションを追加 */}
      <HomeStats />

      <div className={styles.grid}>
        <div className="card">
          <div className={styles.cardContent}>
            <div>
              <div className={styles.cardIcon}>✏️</div>
              <h2 className={styles.cardTitle}>学習をスタート</h2>
              <p className={styles.cardDesc}>
                憲法、民法、行政法など、<br />出題分野を選んで5択問題に挑戦。
              </p>
            </div>
            <Link href="/select-category" className="btn btn-primary w-full">
              問題へ進む
            </Link>
          </div>
        </div>

        <div className="card">
          <div className={styles.cardContent}>
            <div>
              <div className={styles.cardIcon}>📄</div>
              <h2 className={styles.cardTitle}>過去問アップロード</h2>
              <p className={styles.cardDesc}>
                PDF・Excel・画像を取り込み、<br />自動で復習リストに追加。
              </p>
            </div>
            <Link href="/upload" className="btn btn-accent w-full">
              アップロード
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
