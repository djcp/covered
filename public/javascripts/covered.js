$.extend({
  apiEndpoint: function(){ return 'http://api.dp.la/dev/' },
  constructDoc: function(d,facets){
    var node = $('<div />').attr({class: 'doc ' + d.data_source, id: 'doc-' + d.id}).html(d.title);
    $(node).append($('<span />').attr({class: 'data_source'}).html(d.data_source));
    facets[d.data_source] = 1;
    if(d.id_isbn != undefined){
      $(d.id_isbn).each(function(i,isbn){
        $(node).append($('<img />').attr({src: 'http://covers.openlibrary.org/b/isbn/' + isbn + '-S.jpg', class: 'cover'}));
      });
    }
    return node;
  },
  initIsotope: function(){
    $('#target').isotope({
      itemSelector : '.doc',
      layoutMode : 'fitRows'
    });
  }
});

$(document).ready(function(){
  $('form#query').submit(function(e){
    e.preventDefault();
    $.ajax({
      url: $.apiEndpoint() + 'item',
      data: {search_type: 'keyword', query: $('#keyword').val(), facet: 'subject'},
      dataType: 'jsonp',
      beforeSend: function(){
        $('#submit').val('please wait . . .');
        $('#target').html('');
        $('#target').isotope('destroy');
        $('#facets').html('');
      },
      complete: function(){
        $('#submit').val('go!');
        $.initIsotope();
      },
      success: function(json){
        console.log(json);
        var facets = {};
        $(json.docs).each(function(i,el){
          $('#target').append($.constructDoc(el,facets));
        });
        $.each(facets, function(key,val){
          $('#facets').append(key);
        });
      }

    });
  });
});
