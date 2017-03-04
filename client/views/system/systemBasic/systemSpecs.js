Template["systemSpecsFirstPrice"].helpers({
  formatDate: function (str){ return str.split( 'T' )[0]; }
})

Template["systemSpecsCrowdsalesTable"].helpers({

  formatDate: function (str){ 
    return new Date(str).toISOString().split( 'T' );
  }
})

Template["escrowAddressesList"].helpers({
  wrapIntoArrayIfNeeded: function(obj){
    if (Array.isArray( obj )) return obj
    return [obj];
  }
})
