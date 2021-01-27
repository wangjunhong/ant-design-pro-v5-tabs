import React from 'react';
import RightContent from '../RightContent';
import TagsView from './tagsView';
import styles from './index.less';
import titles from './titles/index';

function TagView() {
  const excludePage = ['/user/login'];
  return (
    <div className={styles.tag_view}>
      <RightContent />
      <div className={styles.tabs}>
        <TagsView titles={titles} excludePage={excludePage} />
      </div>
    </div>
  );
}

export default TagView;
