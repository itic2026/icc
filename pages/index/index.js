Page({
  data: {
    levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  startSingleGame: function() {
    wx.navigateTo({
      url: '../game/game?mode=single&level=1'
    })
  },
  startMultiGame: function() {
    wx.navigateTo({
      url: '../game/game?mode=multi&level=1'
    })
  },
  showLevelSelect: function() {
    wx.showActionSheet({
      itemList: this.data.levels.map(level => `关卡 ${level}`),
      success: (res) => {
        const level = res.tapIndex + 1
        wx.navigateTo({
          url: `../game/game?mode=single&level=${level}`
        })
      }
    })
  }
})