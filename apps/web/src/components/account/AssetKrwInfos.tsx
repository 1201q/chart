import styles from './styles/asset.krw.info.module.css';

interface AssetKrwInfosProps {
  available: number;
  locked: number;
  total: number;
}

const AssetKrwInfos = ({ available, locked, total }: AssetKrwInfosProps) => {
  return (
    <>
      <div className={styles.krwWrapper}>
        <div className={styles.simpleRow}>
          <p className={styles.simpleLeft}>주문가능 원화</p>
          <p className={styles.simpleRight}>
            {available.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
          </p>
        </div>
        <div className={styles.simpleRow}>
          <p className={styles.simpleLeft}>주문중</p>
          <p className={styles.simpleRight}>
            {locked.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
          </p>
        </div>
      </div>

      <p className={styles.krwTotal}>
        총 {total.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
      </p>
    </>
  );
};

export default AssetKrwInfos;
