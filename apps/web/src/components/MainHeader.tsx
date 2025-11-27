import styles from './styles/main.header.module.css';

const MainHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.wrapper}>
        <div className={styles.leftWrapper}>
          <div className={styles.icon}>C</div>
          <span className={styles.logoText}>코인차트</span>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
