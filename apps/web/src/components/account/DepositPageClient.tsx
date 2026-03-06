'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './styles/deposit.shell.module.css';
import DepositHistoryPanel from './DepositHistoryPanel';
import DepositFormPanel from './DepositFormPanel';
import { DepositHistoryItem, DepositStatus } from '@/utils/api/deposit.api';

interface Props {
  status: DepositStatus;
  history: DepositHistoryItem[];
}

export default function DepositPageClient({ status, history }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isFormOpen = searchParams.get('form') === 'open';

  const openForm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('form', 'open');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={`${styles.shell} ${isFormOpen ? styles.formOpen : ''}`}>
      <section className={styles.historySection}>
        <DepositHistoryPanel history={history} status={status} onOpenForm={openForm} />
      </section>
      <section className={styles.formSection}>
        <DepositFormPanel status={status} />
      </section>
    </div>
  );
}
