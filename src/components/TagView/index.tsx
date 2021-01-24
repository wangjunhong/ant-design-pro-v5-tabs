import React from 'react';
import RightContent from '../RightContent';
import TagsView from './tagsView';
import styles from './index.less';
import { titles } from './titles';

function TagView() {
  return (
    <div className={styles.tag_view}>
      <RightContent />
      <div className={styles.tabs}>
        <TagsView titles={titles} />
      </div>
    </div>
  );
}

export default TagView;
