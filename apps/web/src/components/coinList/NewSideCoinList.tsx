'use client';

import NewTickerList from './NewTickerList';
import styles from './styles/coinlist.module.css';
import TickerListController from './TickerListController';

const NewSideCoinList = () => {
  return (
    <div className={styles.wrapper}>
      <TickerListController />
      <NewTickerList />
    </div>
  );
};

export default NewSideCoinList;
