#!/bin/bash
set -e
#set -x

l_mode=$1


function usage()
{
   echo "Choose your mode : dev dev-nomin, prod or prod-nomin"
   exit 0
}

if [ "${l_mode}" == "" ] ; then
  usage
fi


l_version=$(grep version package.json | cut -d'"' -f4)
l_output="linshare-ui-admin-${l_version}.tar.bz2"
l_hash="linshare-ui-admin-${l_version}.sha256sum"
l_git_uuid=$(git log -n 1 --format=oneline|cut -d' ' -f1)
l_dist=linshare-ui-admin-${l_version}
l_date=$(date "+%Y%m%d%H%M%S")


echo "INFO: Cleaning ..."
rm -fr linshare-ui-admin-*
echo "INFO: Building ..."
if [ "${l_mode}" == "dev" ] || [ "${l_mode}" == "prod" ] ; then
  ./node_modules/.bin/grunt build
elif [ "${l_mode}" == "dev-nomin" ] || [ "${l_mode}" == "prod-nomin" ] ; then
  ./node_modules/.bin/grunt build --gruntfile noMinifyerGruntfile.js
else
  usage
fi

echo "INFO: Packaging..."
if [ "${l_mode}" == "dev" ] ; then
  l_dist="linshare-ui-admin-${l_version}-${l_git_uuid}"
  l_output="linshare-ui-admin-${l_version}-${l_date}-${l_git_uuid}.tar.bz2"
  l_hash="linshare-ui-admin-${l_version}-${l_date}-${l_git_uuid}.sha256sum"
elif [ "${l_mode}" == "dev-nomin" ] ; then
  l_dist="linshare-ui-admin-${l_version}-nomin-${l_date}-${l_git_uuid}"
  l_output="linshare-ui-admin-${l_version}-nomin-${l_date}-${l_git_uuid}.tar.bz2"
  l_hash="linshare-ui-admin-${l_version}-nomin-${l_git_uuid}.sha256sum"
elif [ "${l_mode}" == "prod-nomin" ] ; then
  l_dist="linshare-ui-admin-${l_version}-nomin"
  l_output="linshare-ui-admin-${l_version}-nomin.tar.bz2"
  l_hash="linshare-ui-admin-${l_version}-nomin.sha256sum"
fi

mv -v dist ${l_dist}
if [ "${l_mode}" == "dev" ] || [ "${l_mode}" == "dev-nomin" ] ; then
  sed -i -e 's/version.*$/version": "'${l_version}-${l_git_uuid}'",/g' ${l_dist}/about.json
else
  sed -i -e 's/debug: true/debug: false/g' ${l_dist}/scripts/config.js
fi

tar cjf ${l_output} ${l_dist}
sha256sum ${l_output} > ${l_hash}
mkdir -p distrib
mv -v ${l_output} distrib/
mv -v ${l_hash} distrib/

echo "INFO: Done"

