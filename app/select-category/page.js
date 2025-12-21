import Link from 'next/link';
import styles from './page.module.css';

const categories = [
    { id: 'constitution', name: '憲法', icon: '🏛️', desc: '人権、統治機構など' },
    { id: 'administrative', name: '行政法', icon: '📋', desc: '行政手続法、行政不服審査法など' },
    { id: 'civil', name: '民法', icon: '🤝', desc: '総則、物権、債権、親族・相続' },
    { id: 'commercial', name: '商法・会社法', icon: '🏢', desc: '商号、会社設立、機関設計など' },
];

export default function SelectCategory() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink} aria-label="戻る">
                    ←
                </Link>
                <h1 className={styles.title}>分野を選択</h1>
            </header>

            <div className={styles.grid}>
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/quiz?category=${cat.id}`}
                        className={styles.categoryCard}
                    >
                        <div className={styles.icon}>{cat.icon}</div>
                        <div className={styles.info}>
                            <div className={styles.name}>{cat.name}</div>
                            <div className={styles.desc}>{cat.desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
