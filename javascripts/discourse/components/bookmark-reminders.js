import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { TrackedArray } from "@ember-compat/tracked-built-ins";
import { ajax } from "discourse/lib/ajax";

export default class BookmarkDeadline extends Component {
  @service currentUser;
  @tracked bookmarks;
  todayBookmarks = new TrackedArray();
  thisWeekBookmarks = new TrackedArray();
  overdueBookmarks = new TrackedArray();

  constructor() {
    super(...arguments);

    if (!this.currentUser) {
      return;
    }

    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(today);
    endOfWeek.setHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

    this.loadBookmarks().then((result) => {
      const restBookmarks = [];

      this.bookmarks = result.user_bookmark_list.bookmarks
        .filter((bookmark) => bookmark.reminder_at !== null)
        .forEach((bookmark) => {
          const reminderDate = bookmark.reminder_at
            ? new Date(bookmark.reminder_at)
            : null;
          if (reminderDate <= today) {
            this.overdueBookmarks.push(bookmark);
          } else if (reminderDate.toDateString() === today.toDateString()) {
            this.todayBookmarks.push(bookmark);
          } else if (reminderDate >= startOfWeek && reminderDate <= endOfWeek) {
            this.thisWeekBookmarks.push(bookmark);
          } else {
            restBookmarks.push(bookmark);
          }
        });
    });
  }

  loadBookmarks() {
    let url = `/u/${this.currentUser.username}/bookmarks.json`;
    return ajax(url);
  }
}
