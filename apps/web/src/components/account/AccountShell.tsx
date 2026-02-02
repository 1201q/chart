import styles from './styles/account.shell.module.css';

interface AccountShellProps {
  isDetailOpen: boolean;
  ordersComponent?: React.ReactNode;
  detailComponent?: React.ReactNode;
}

const AccountShell = ({
  isDetailOpen,
  ordersComponent,
  detailComponent,
}: AccountShellProps) => {
  return (
    <div className={`${styles.shell} ${isDetailOpen ? styles.detailOpen : ''}`}>
      <section className={styles.ordersSection}>{ordersComponent}</section>
      <section className={styles.detailSection}>{detailComponent}</section>
    </div>
  );
};

export default AccountShell;
