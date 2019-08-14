import React from 'react';
import { Icon, Card } from 'semantic-ui-react';

const extra = url => (
  <a href={url} target="_blanck">
    <Icon name="linkify" />
    {url}
  </a>
);

const addDefaultSrc = event => {
  event.target.style.display = 'none';
};

const displayFavicon = data => {
  if (data.favicon.includes('http://') || data.favicon.includes('https://')) {
    return data.favicon;
  } else {
    return `${data.url}${data.favicon}`;
  }
};

const displayTitle = data => {
  return data.favicon ? (
    <span className="metadata__favicon">
      <img
        src={displayFavicon(data)}
        onError={addDefaultSrc}
        alt={data.title}
        className="metadata__favicon_img"
      />
      {data.title}
    </span>
  ) : (
    <div className="metadata__title"> {data.title} </div>
  );
};

const LinksMetaData = ({ metadata }) => (
  <React.Fragment>
    {metadata.map(data => (
      <Card
        key={data.title}
        image={data.image}
        header={displayTitle(data)}
        meta={data.url}
        description={data.description}
        extra={extra(data.url)}
        style={{ marginBottom: '1em' }}
      />
    ))}
  </React.Fragment>
);

export default LinksMetaData;
