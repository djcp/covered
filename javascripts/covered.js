$.extend({

  apiEndpoint: function(){ return 'http://api.dp.la/dev/' },

  searchables: function(){
    return {
      keyword: 'All fields',
      title: 'Title',
      title_keyword: 'Title, keyword',
      creator: 'Creator',
      creator_keyword: 'Creator, keyword',
      date: 'Date',
      description: 'Description',
      description_keyword: 'Description, keyword',
      subject: 'Subject',
      subject_keyword: 'Subject, keyword',
      publisher: 'Publisher',
      language: 'Language',
      id_isbn: 'ISBN',
      id_oclc: 'OCLC',
      id_lccn: 'LCCN',
      id_inst: 'Partner Id',
      call_num: 'Call Number',
      height: 'Height',
      page_count: 'Page Count',
      relation: 'Relation',
      content_link: 'Context Link',
      rights: 'Rights',
      data_source: 'Data Source',
      resource_type: 'Resource Type'
    };
  },

  constructDoc: function(d,facets){
    var node = $('<div />').attr({class: 'doc ' + d.data_source, id: 'doc-' + d.id}), nodeContent = '';
    if(d.id_isbn != undefined){
      $.each(d.id_isbn,function(i,isbn){
      	// var related = $.relatedEditions(isbn);
      	nodeContent += '<img src="http://covers.openlibrary.org/b/isbn/' + isbn + '-S.jpg" class="cover" />';
      	});
    }
    console.log(d);
    if(d.content_link){nodeContent += '<a href="' + d.content_link[0] + '">';}
    nodeContent += (d.title) ? $.ellipsisSubstr(d.title) : 'Untitled Work';
    if(d.content_link){nodeContent += '</a>';}
    nodeContent += '<span class="data_source">' + d.data_source + '</span>';
    facets[d.data_source] = (facets[d.data_source] == undefined) ? 1 : (facets[d.data_source] + 1);
    return node.append(nodeContent);
  },
	
	relatedEditions: function(isbn){
		var related = [];
		$.getJSON('http://xisbn.worldcat.org/webservices/xid/isbn/' + isbn + '?method=getEditionsa&format=json&fl=*&callback=?')
			.done(function(data){
				if(data.list.length >= 1){
					$.each(data.list,function(i,record){
						related.push(record.isbn[0]);
						});
					}
				});
		return related;
		},
	
	ellipsisSubstr: function(inString){
		var max = arguments[1] || 100, suffix = arguments[2] || '…'; 
		if(inString.length >= max){
			return inString.substr(0,max) + suffix;
			}
		else{return inString;}
		},
	
  initIsotope: function(){
    var isotope_obj = $('#target').isotope({
      columnWidth: 300,
      itemSelector : '.doc',
      layoutMode : 'masonry'
    });
  },

  postInit: function(){
    $('.filter').click(function(e){
      $('#target').isotope({filter: $(this).attr('data_filter_class')});
    });
    // relayout as cover images may've effected container height.
    setTimeout(function(){$('#target').isotope('reLayout')}, 500);
  },

  initSearchables: function(){
    $('#searchables').append('<select id="searchable_select" />');
    $.each($.searchables(),function(i,el){
      $('#searchables select').append($('<option/>').attr({value: i}).html(el));
    });
  },

  formatQuery: function(){
    var query = {facet: 'subject'};
    $('.searchable_term').each(function(){
      query[$(this).attr('data_term_searchable')] = $(this).attr('data_term_value');
    });
    return query;
  }

});

$(document).ready(function(){
  $.initSearchables();

  $('#add_searchable').click(function(e){
    e.preventDefault();
    if($('#term').val() == ''){
      return alert('please enter a term');
    }
    $('#terms').append(
      $('<span class="searchable_term" />').attr({data_term_value: $('#term').val(), data_term_searchable: $('#searchable_select').val()}).html('<span class="term_field">' + $('#searchable_select').val() + ' </span>: ' + $('#term').val())
    );

  });

  $('#keyword').focus();
  $('form#query').submit(function(e){
    e.preventDefault();
    var query = $.formatQuery();
    $.ajax({
      url: $.apiEndpoint() + 'item',
      data: query,
      dataType: 'jsonp',
      beforeSend: function(){
        $('#submit').val('please wait . . .');
        $('#target').html('');
        $('#target').isotope('destroy');
        $('#facets').html('');
        $('#nope').remove();
      },
      complete: function(){
        $('#submit').val('go!');
        $.postInit();
      },
      success: function(json){
        $.initIsotope();
        console.log(json);
        var facets = {};
        $(json.docs).each(function(i,el){
          $('#target').isotope('insert',$.constructDoc(el,facets));
        });
        $.each(facets, function(key,val){
          $('#facets').append($('<span/>').attr({class: 'filter', data_filter_class: "." + key}).html(key + ' - ' + val));
        });
        $('#facets').append($('<span/>').attr({class: 'filter', data_filter_class: '*'}).html('Show all'));
        if(json.docs.length == 0){
          $('#submit').after('<span id="nope">None found.</span>');
        }
      }
    });
  });
});
