Template['cgSystemLogo'].rendered = function () {

};

Template['cgSystemLogo'].helpers({
    img_url: function () {
      var system = this.system;
      if (typeof system == 'string') system = CurrentData.findOne({_id:system})
      return CF.Chaingear.helpers.cgSystemLogoUrl(system)
    }
});

Template['cgSystemLogo'].events({
    'click .bar': function (e, t) {

    }
});