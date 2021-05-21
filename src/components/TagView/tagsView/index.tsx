import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import { Scrollbars } from 'react-custom-scrollbars';
import { useIntl, history } from 'umi';
import EventEmitter from '@/utils/eventEmitter';
import styles from './index.less';
import locales from './locales/index';

type Route = {
  title: string;
  path: string;
  closable: boolean;
  query?: any;
};

const TagsView = (props: {
  titles: Record<string, Record<string, string>>;
  excludePage: string[];
}) => {
  const { titles, excludePage } = props;
  const ScrollbarsRef = useRef<any>();
  const intl = useIntl();

  // 根据当前语言获取自定义的文案
  const lang = locales[intl.locale];

  // 设置文案的方法 没有值时返回默认的
  const setLang = (key: string, value: string) => {
    if (lang && lang[key]) {
      return lang[key];
    }
    return value;
  };

  // 第一个需要单独设置
  const getAffix = useCallback(() => {
    const title = titles[intl.locale] ? titles[intl.locale]['/welcome'] : '首页';
    return {
      path: '/welcome',
      closable: false,
      title,
    };
  }, [intl.locale, titles]);

  // 设置本地缓存
  const setSessionStorage = (visitedViews: Route[]) => {
    sessionStorage.setItem('visitedViews', JSON.stringify(visitedViews));
  };

  // 监听窗口事件
  useEffect(() => {
    const listener = (ev: Event) => {
      ev.preventDefault();
      sessionStorage.setItem('locale', intl.locale);
    };
    window.addEventListener('beforeunload', listener);
    return () => {
      window.removeEventListener('beforeunload', listener);
    };
  }, [intl]);

  // 读取本地缓存 判断有没有切换语言
  const getSessionStorage = useCallback(() => {
    const affix = getAffix();
    const locale = sessionStorage.getItem('locale');
    if (locale !== intl.locale) {
      sessionStorage.setItem('locale', intl.locale);
      sessionStorage.removeItem('visitedViews');
      return [affix];
    }
    const str = sessionStorage.getItem('visitedViews');
    if (str) {
      return JSON.parse(str);
    }
    return [affix];
  }, [getAffix, intl.locale]);

  // 判断是不是当前页
  const isActive = (item: Route) => {
    if (item.path === history.location.pathname) {
      return true;
    }
    return false;
  };

  // tabs状态
  const [visitedViews, setVisitedViews] = useState<Route[]>(getSessionStorage());

  // 关闭标签
  const closeSelectedTag = (tag: Route) => {
    let num = 0;
    const active = isActive(tag);
    const arr = getSessionStorage();
    arr.some((item: Route, index: number) => {
      if (item.path === tag.path) {
        num = index;
        return true;
      }
      return false;
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
        query,
      });
    }
  };

  // 监听路由改变
  // const routerList = JSON.parse(sessionStorage.getItem('routerList') || '[]');
  const onChange = (params: any) => {
    // 排除一些页面 多了可使用Includes
    if (excludePage.includes(history.location.pathname)) {
      return;
    }
    const arr = getSessionStorage();
    let num = 0;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const t = arr.some((t: Route, index: number) => {
      if (t.path === params.pathname) {
        num = index;
        return true;
      }
      return false;
    });
    const { pathname, query } = params;
    // 先在手动配置里面找 没有配置就在路由里找（登录的时候需要设置到sessionStorage）
    let title = titles[intl.locale] && titles[intl.locale][pathname];
    if (title && JSON.stringify(query) !== '{}') {
      title = title.replace(setLang('add', '新增'), setLang('edit', '编辑'));
    }
    // 需要根据实际情况修改 可以全部配置，也可由外面传递方法进来 例如 title=getMenuTitle()
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
    } else if (num === 0) {
      // 替换(首页不关闭)
      arr.splice(num, 1, getAffix());
    } else {
      arr.splice(num, 1, obj);
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
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const closeOthersTags = (selectedTag: any) => {
    let arr = getSessionStorage();
    arr = arr.filter((item: Route) => !item.closable || selectedTag.path === item.path);
    const active = isActive(selectedTag);
    if (!active) {
      const { path, query } = selectedTag;
      history.push({
        pathname: path,
        query,
      });
    }
    setVisitedViews(arr);
    setSessionStorage(arr);
  };

  // 关闭所有
  const closeAllTags = () => {
    const affix = getAffix();
    setVisitedViews([affix]);
    setSessionStorage([affix]);
    history.push('/welcome');
  };
  const [visible, setVisible] = useState(false);

  // 右键显示三个按钮
  const openMenu = (e: any, t: Route) => {
    e.preventDefault();
    setSelectedTag(t);
    setLeft(e.clientX);
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
                  query: tag.query,
                });
              }}
              // eslint-disable-next-line no-restricted-globals
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
        <ul style={{ left: `${left}px`, top: '76px' }} className={styles.contextmenu}>
          {selectedTag && selectedTag.closable && (
            <li onClick={() => closeSelectedTag(selectedTag)}>{setLang('close', '关闭')}</li>
          )}
          <li onClick={() => closeOthersTags(selectedTag)}>{setLang('closeOther', '关闭其他')}</li>
          <li onClick={() => closeAllTags()}>{setLang('closeAll', '关闭所有')}</li>
        </ul>
      )}
    </div>
  );
};

export default TagsView;
