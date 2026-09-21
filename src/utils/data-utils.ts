import { type CollectionEntry } from 'astro:content';
import { slugify } from './common-utils';

// 一天发好几篇是常态，只比日期会让同日文章退化成按文件名排；用 issue 编号（随发布时间单调递增）兜底
export function sortItemsByDateDesc(itemA: CollectionEntry<'blog'>, itemB: CollectionEntry<'blog'>) {
    const byDate = new Date(itemB.data.publishDate).getTime() - new Date(itemA.data.publishDate).getTime();
    if (byDate !== 0) return byDate;

    const byIssue = (itemB.data.issue ?? -1) - (itemA.data.issue ?? -1);
    if (byIssue !== 0) return byIssue;

    return itemB.id.localeCompare(itemA.id);
}

export function getAllTags(posts: CollectionEntry<'blog'>[]) {
    const tags: string[] = [...new Set(posts.flatMap((post) => post.data.tags || []).filter(Boolean))];
    return tags
        .map((tag) => {
            return {
                name: tag,
                id: slugify(tag)
            };
        })
        .filter((obj, pos, arr) => {
            return arr.map((mapObj) => mapObj.id).indexOf(obj.id) === pos;
        });
}

export function getPostsByTag(posts: CollectionEntry<'blog'>[], tagId: string) {
    const filteredPosts: CollectionEntry<'blog'>[] = posts.filter((post) => (post.data.tags || []).map((tag) => slugify(tag)).includes(tagId));
    return filteredPosts;
}
