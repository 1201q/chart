import styles from './styles/login.page.module.css';

const LoginPageClient = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>로그인</h2>

      <span className={styles.desc}>
        지금 로그인하고, 실시간 모의 거래를 경험해보세요.
      </span>

      <div className={styles.buttonWrapper}>
        <button className={styles.loginButton}>
          <span>Google 계정으로 로그인</span>
        </button>
        <button className={styles.loginButton}>
          <span>Naver 계정으로 로그인</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPageClient;
