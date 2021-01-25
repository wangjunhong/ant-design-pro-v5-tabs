import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Scrollbars } from 'react-custom-scrollbars';
import { history } from 'umi';
import EventEmitter from '@/utils/eventEmitter';
import styles from './index.less';

type Route = {
  title: string;
  path: string;
  closable: boolean;
  query?: any;
};

const TagsView = (props: {
  titles: {
    [key: string]: string;
  };
}) => {
  const { titles } = props;
  const ScrollbarsRef = useRef<any>();

  const affix = {
    title: '首页',
    path: '/welcome',
    closable: false,
  };

  //设置本地缓存
  const setSessionStorage = (visitedViews: Route[]) => {
    sessionStorage.setItem('visitedViews', JSON.stringify(visitedViews));
  };

  // 读取本地缓存
  const getSessionStorage = () => {
    let str = sessionStorage.getItem('visitedViews');
    if (str) {
      return JSON.parse(str);
    } else {
      return [affix];
    }
  };

  // tabs状态
  const [visitedViews, setVisitedViews] = useState<Route[]>(getSessionStorage());

  //关闭标签
  const closeSelectedTag = (tag: Route) => {
    let num = 0;
    let active = isActive(tag);
    let arr = getSessionStorage();
    arr.some((item: Route, index: number) => {
      if (item.path === tag.path) {
        num = index;
      }
    });

    if (num !== 0) {
      arr.splice(num, 1);
    }
    setVisitedViews(arr);
    setSessionStorage(arr);
    if (active) {
      const { path, query } = arr[arr.length - 1];
      history.push({
        pathname: path,
        state: query,
      });
    }
  };

  // 判断是不是当前页
  const isActive = (item: Route) => {
    if (item.path === history.location.pathname) {
      return true;
    }
    return false;
  };

  // 监听路由改变
  // const routerList = JSON.parse(sessionStorage.getItem('routerList') || '[]');
  const onChange = (params: any) => {
    // 排除一些页面 多了可使用Includes
    if (history.location.pathname === '/login' || history.location.pathname === '/forgotPwd') {
      return;
    }
    let arr = getSessionStorage();
    let num = 0;
    const t = arr.some((t: Route, index: number) => {
      if (t.path === params.pathname) {
        num = index;
        return true;
      }
      return false;
    });
    const { pathname, query } = params;
    //先在手动配置里面找 没有配置就在路由里找（登录的时候需要设置到sessionStorage）
    let title = titles[pathname];
    if (title && JSON.stringify(query) !== '{}') {
      title = title.replace('新增', '编辑');
    }
    //需要根据实际情况修改
    // routerList.some((item: any) => {
    //   if (pathname === `/${item.permissionCode}`) {
    //     if (item.menuName === item.permissionName) {
    //       title = item.permissionName;
    //     } else {
    //       title = item.menuName + ' - ' + item.permissionName;
    //     }
    //     return true;
    //   } else {
    //     return false;
    //   }
    // });
    const obj = {
      title: title || pathname,
      path: pathname,
      query,
      closable: true,
    };

    if (!t) {
      // 添加
      arr.push(obj);
      setTimeout(() => {
        ScrollbarsRef?.current?.scrollToRight();
      }, 100);
    } else {
      // 替换(首页不更新)
      if (num !== 0) {
        arr.splice(num, 1, obj);
      }
    }

    setVisitedViews(arr);
    setSessionStorage(arr);
  };

  // 路由改变新增tab
  useEffect(() => {
    EventEmitter.on('routerChange', onChange);
  }, []);

  // 监听移除事件
  useEffect(() => {
    EventEmitter.on('closeSelectedTag', closeSelectedTag);
  }, []);

  const [selectedTag, setSelectedTag] = useState<Route | null>(null);
  const [left, setLeft] = useState(0);

  // 关闭其他
  const closeOthersTags = (selectedTag: any) => {
    let arr = getSessionStorage();
    arr = arr.filter((item: Route) => !item.closable || selectedTag.path === item.path);
    let active = isActive(selectedTag);
    if (!active) {
      const { path, query } = selectedTag;
      history.push({
        pathname: path,
        state: query,
      });
    }
    setVisitedViews(arr);
    setSessionStorage(arr);
  };

  // 关闭所有
  const closeAllTags = () => {
    setVisitedViews([affix]);
    setSessionStorage([affix]);
    history.push('/welcome');
  };
  const [visible, setVisible] = useState(false);

  // 右键显示三个按钮
  const openMenu = (e: any, t: Route) => {
    e.preventDefault();
    setSelectedTag(t);
    setLeft(e.clientX - 220);
    setVisible(true);
  };

  // 关闭右键显示的内容
  const closeMenu = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      document.body.addEventListener('click', closeMenu);
    } else {
      document.body.removeEventListener('click', closeMenu);
    }
  }, [visible]);

  return (
    <div className={styles.tags_view_container}>
      <div className={styles.tags_view_wrapper}>
        <Scrollbars
          autoHide
          ref={ScrollbarsRef}
          style={{ width: '100%', height: 34, whiteSpace: 'nowrap' }}
        >
          {visitedViews.map((tag) => (
            <a
              className={
                isActive(tag) ? `${styles.tags_view_item} ${styles.active}` : styles.tags_view_item
              }
              key={tag.path}
              onClick={() => {
                history.push({
                  pathname: tag.path,
                  state: tag.query,
                });
              }}
              onContextMenu={() => openMenu(event, tag)}
            >
              {tag.title}
              {tag.closable && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSelectedTag(tag);
                  }}
                  className={styles.el_icon_close}
                >
                  ×
                </span>
              )}
            </a>
          ))}
        </Scrollbars>
      </div>

      {visible && (
        <ul style={{ left: left + 'px', top: '30px' }} className={styles.contextmenu}>
          {selectedTag && selectedTag.closable && (
            <li onClick={() => closeSelectedTag(selectedTag)}>关闭</li>
          )}
          <li onClick={() => closeOthersTags(selectedTag)}>关闭其他</li>
          <li onClick={() => closeAllTags()}>关闭所有</li>
        </ul>
      )}
    </div>
  );
};

export default TagsView;
